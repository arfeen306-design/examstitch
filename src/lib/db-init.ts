/**
 * Database initialization & subject provisioning (admin/service-role only).
 * Call from Server Actions — never import into client components.
 */
export {
  ensureSyllabiForSubject,
  provisionSubjectPortal,
} from '@/lib/db/subject-provisioner';
