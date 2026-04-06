
-- Insert 4 new objectives under "Expansão através de franquias" (3994697a)
INSERT INTO public.objectives (id, title, cycle_id, owner_id, parent_objective_id, objective_type, status, progress)
VALUES
  (gen_random_uuid(), 'Finalizar documentação até 30/04', '177e9f16-d032-40ed-894d-aa7f216d4a79', 'f74d0a20-3d45-48d0-8b76-b532b037e35a', '3994697a-cd6a-44e3-a248-f01d6007123c', 'quarterly', 'on_track', 0),
  (gen_random_uuid(), 'Estruturar plano de Marketing ate 30/04', '177e9f16-d032-40ed-894d-aa7f216d4a79', 'f74d0a20-3d45-48d0-8b76-b532b037e35a', '3994697a-cd6a-44e3-a248-f01d6007123c', 'quarterly', 'on_track', 0),
  (gen_random_uuid(), 'Estruturar processos para operacionalizar a 1ª franquia até 31/05', '177e9f16-d032-40ed-894d-aa7f216d4a79', 'f74d0a20-3d45-48d0-8b76-b532b037e35a', '3994697a-cd6a-44e3-a248-f01d6007123c', 'quarterly', 'on_track', 0),
  (gen_random_uuid(), 'Estruturar Manual franqueado em video ate 31/05', '177e9f16-d032-40ed-894d-aa7f216d4a79', 'f74d0a20-3d45-48d0-8b76-b532b037e35a', '3994697a-cd6a-44e3-a248-f01d6007123c', 'quarterly', 'on_track', 0);

-- Delete the 4 KRs from "Criar landing page até 30/04"
DELETE FROM public.key_results WHERE id IN (
  'b89a8726-0ee9-4b1d-a1df-21b0ee01e6ff',
  '111df85a-148a-4495-9c7d-89eaf180d73f',
  '490d16b5-a145-4c8d-9569-06a3c38903f6',
  'afd280c2-8915-4d49-8c75-3173e39ee6a2'
);
