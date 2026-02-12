
-- Add missing FK from change_requests.requested_by to profiles
ALTER TABLE public.change_requests
ADD CONSTRAINT change_requests_requested_by_fkey
FOREIGN KEY (requested_by) REFERENCES public.profiles(id);

-- Add missing FK from okr_collaborators.user_id to profiles
ALTER TABLE public.okr_collaborators
ADD CONSTRAINT okr_collaborators_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);
