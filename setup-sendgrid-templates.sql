-- Setup SendGrid Dynamic Templates
-- This SQL script configures your email templates to use SendGrid dynamic templates

-- Insert or update password reset template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('password_reset', 'Password Reset', 'd-7eb7ea1c19ca4090a0cefa3a2be75088', 'Let''s reset your password', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Insert or update registration submitted template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('registration_submitted', 'Registration Submitted', 'd-4eca2752ddd247158dd1d5433407cd5e', 'Your Registration Has Been Submitted', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Insert or update team approved template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('team_approved', 'Team Approved / Payment Processed', 'd-1bca14d4dc8e41e5a7ed2131124d470e', 'Your Team is Officially In! 🎉 – {{eventName}}', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Insert or update team rejected template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('team_rejected', 'Team Not Approved', 'd-4160d22e727944128335d7a3910b8092', 'Your Team Registration for {{eventName}} – Not Approved', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Insert or update team waitlisted template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('team_waitlisted', 'Waitlisted Team', 'd-23265a10149a4144893cf84e32cc3f54', 'Waitlist Notification for {{teamName}} – {{eventName}}', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Insert or update payment confirmation template
INSERT INTO email_templates (type, name, sendgrid_template_id, subject, content, is_active, sender_email, sender_name, created_at, updated_at)
VALUES ('payment_confirmation', 'Payment Confirmation', 'd-3697f286c1e748f298710282e515ee25', 'Confirmation of your Recent Team Registration', '', true, 'support@matchpro.ai', 'MatchPro', NOW(), NOW())
ON CONFLICT (type) 
DO UPDATE SET 
  name = EXCLUDED.name,
  sendgrid_template_id = EXCLUDED.sendgrid_template_id,
  subject = EXCLUDED.subject,
  is_active = EXCLUDED.is_active,
  sender_email = EXCLUDED.sender_email,
  sender_name = EXCLUDED.sender_name,
  updated_at = NOW();

-- Verify configuration
SELECT type, name, sendgrid_template_id, is_active 
FROM email_templates 
WHERE sendgrid_template_id IS NOT NULL 
ORDER BY type;