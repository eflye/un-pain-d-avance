import type { Access } from 'payload'

// Seuls les gestionnaires ont un compte : tout utilisateur connecté est un administrateur du back-office.
export const authenticated: Access = ({ req }) => Boolean(req.user)

export const anyone: Access = () => true
