
ALTER TABLE profiles ADD COLUMN cpf text;
ALTER TABLE profiles ADD COLUMN birth_date date;
ALTER TABLE profiles ADD COLUMN language text DEFAULT 'pt-BR';
ALTER TABLE profiles ADD COLUMN job_title text;
ALTER TABLE profiles ADD COLUMN department text;
ALTER TABLE profiles ADD COLUMN management text;
ALTER TABLE profiles ADD COLUMN manager_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN receive_feedback_emails boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN eligible_for_bonus boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN config_panel_access boolean DEFAULT false;
