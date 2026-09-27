import { getPayload, type Payload, type PayloadRequest, ValidationError } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { PickupSlots } from '@/collections/PickupSlots'
import { dateKeyToStorage } from '@/lib/dates'
import { computeDefaultDeadline } from '@/lib/pickup-slots'
import {
  generateRecurringSlots,
  getDeadlineRule,
  parseRecurringSlotsInput,
} from '@/services/pickup-slots'

let payload: Payload
let activeLocation: number
let inactiveLocation: number
const suffix = Date.now()

const baseSlot = { startTime: '09:30', endTime: '10:15' }

describe('Passages', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: (await import('@/payload.config')).default })
    activeLocation = (
      await payload.create({
        collection: 'locations',
        data: { name: `Village test ${suffix}`, address: 'Place de l’église' },
      })
    ).id
    inactiveLocation = (
      await payload.create({
        collection: 'locations',
        data: { name: `Village fermé ${suffix}`, address: 'Mairie' },
      })
    ).id
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'pickup-slots',
      where: { location: { in: [activeLocation, inactiveLocation] } },
    })
    await payload.delete({
      collection: 'locations',
      where: { id: { in: [activeLocation, inactiveLocation] } },
    })
  })

  it('applique la date limite par défaut et génère le titre', async () => {
    const slot = await payload.create({
      collection: 'pickup-slots',
      data: { ...baseSlot, date: dateKeyToStorage('2027-03-06'), location: activeLocation },
    })
    const rule = await getDeadlineRule(payload)
    expect(slot.orderDeadline).toBe(computeDefaultDeadline('2027-03-06', rule).toISOString())
    expect(slot.title).toBe(`samedi 6 mars 2027 · Village test ${suffix} · 09:30–10:15`)
  })

  it('stocke la date civile de Paris à midi UTC', async () => {
    // 23:30 UTC le 13 mars = 00:30 le 14 mars à Paris
    const slot = await payload.create({
      collection: 'pickup-slots',
      data: { ...baseSlot, date: '2027-03-13T23:30:00.000Z', location: activeLocation },
    })
    expect(slot.date).toBe('2027-03-14T12:00:00.000Z')
  })

  it('refuse deux passages au même lieu le même jour', async () => {
    const error = await payload
      .create({
        collection: 'pickup-slots',
        data: { ...baseSlot, date: dateKeyToStorage('2027-03-06'), location: activeLocation },
      })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ValidationError)
    expect((error as ValidationError).data.errors).toEqual([
      expect.objectContaining({ path: 'date', message: expect.stringMatching(/existe déjà/) }),
    ])
  })

  it('refuse une date limite postérieure au début du passage', async () => {
    await expect(
      payload.create({
        collection: 'pickup-slots',
        data: {
          ...baseSlot,
          date: dateKeyToStorage('2027-03-27'),
          location: activeLocation,
          orderDeadline: '2027-03-27T09:00:00.000Z',
        },
      }),
    ).rejects.toThrow()
  })

  it('refuse un créneau dont la fin précède le début', async () => {
    await expect(
      payload.create({
        collection: 'pickup-slots',
        data: {
          date: dateKeyToStorage('2027-03-28'),
          location: activeLocation,
          startTime: '10:00',
          endTime: '09:00',
        },
      }),
    ).rejects.toThrow()
  })

  it('ne montre aux visiteurs que les passages ouverts, non clos, dans un lieu actif', async () => {
    const create = (date: string, extra: Record<string, unknown>) =>
      payload.create({
        collection: 'pickup-slots',
        data: { ...baseSlot, date: dateKeyToStorage(date), location: activeLocation, ...extra },
      })
    await create('2027-05-01', { publicNote: 'visible' })
    await create('2027-05-08', { publicNote: 'fermé', isOpen: false })
    await create('2027-05-15', { publicNote: 'clos', orderDeadline: '2020-01-01T00:00:00.000Z' })
    await payload.create({
      collection: 'pickup-slots',
      data: {
        ...baseSlot,
        date: dateKeyToStorage('2027-05-01'),
        location: inactiveLocation,
        publicNote: 'lieu inactif',
      },
    })
    await payload.update({ collection: 'locations', id: inactiveLocation, data: { active: false } })

    const { docs } = await payload.find({
      collection: 'pickup-slots',
      overrideAccess: false,
      where: {
        and: [
          { location: { in: [activeLocation, inactiveLocation] } },
          { date: { greater_than_equal: dateKeyToStorage('2027-05-01') } },
          { date: { less_than_equal: dateKeyToStorage('2027-05-31') } },
        ],
      },
    })
    expect(docs.map((slot) => slot.publicNote)).toEqual(['visible'])
  })

  it('génère les passages récurrents sans doublon', async () => {
    const input = {
      location: activeLocation,
      weekday: 6,
      from: '2027-04-01',
      to: '2027-04-30',
      ...baseSlot,
    }
    const first = await generateRecurringSlots(payload, input)
    expect(first).toEqual({
      created: ['2027-04-03', '2027-04-10', '2027-04-17', '2027-04-24'],
      skipped: [],
    })
    const second = await generateRecurringSlots(payload, input)
    expect(second.created).toEqual([])
    expect(second.skipped).toHaveLength(4)
  })

  it('refuse la génération aux visiteurs non connectés', async () => {
    const [generate] = PickupSlots.endpoints || []
    await expect(generate.handler({ user: null } as unknown as PayloadRequest)).rejects.toThrow(
      /Non autorisé/,
    )
  })

  it('refuse les saisies de génération invalides', () => {
    const valid = {
      location: 1,
      weekday: 6,
      from: '2027-04-01',
      to: '2027-04-30',
      ...baseSlot,
    }
    expect(typeof parseRecurringSlotsInput(valid)).toBe('object')
    expect(typeof parseRecurringSlotsInput({ ...valid, location: '' })).toBe('string')
    expect(typeof parseRecurringSlotsInput({ ...valid, weekday: 8 })).toBe('string')
    expect(typeof parseRecurringSlotsInput({ ...valid, from: 'demain' })).toBe('string')
    expect(typeof parseRecurringSlotsInput({ ...valid, endTime: '09:00' })).toBe('string')
    expect(typeof parseRecurringSlotsInput({ ...valid, maxOrders: 0 })).toBe('string')
    expect(parseRecurringSlotsInput({ ...valid, maxOrders: '' })).toMatchObject({ maxOrders: null })
  })

  it('empêche de supprimer un lieu qui a des passages', async () => {
    await expect(payload.delete({ collection: 'locations', id: activeLocation })).rejects.toThrow(
      /passages/,
    )
  })
})
