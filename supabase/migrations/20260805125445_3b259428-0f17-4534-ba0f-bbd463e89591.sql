
-- Conversations: one per employee
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  employee_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Helper: is this conversation mine (as employee)?
CREATE OR REPLACE FUNCTION public.is_my_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    JOIN public.employees e ON e.id = c.employee_id
    WHERE c.id = _conversation_id
      AND e.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_my_employee_row(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = _employee_id AND e.user_id = auth.uid()
  )
$$;

CREATE POLICY "Staff can view own conversation"
ON public.chat_conversations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_employee_row(employee_id)
);

CREATE POLICY "Staff can create own conversation"
ON public.chat_conversations FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_employee_row(employee_id)
);

CREATE POLICY "Staff can update own conversation"
ON public.chat_conversations FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_employee_row(employee_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_employee_row(employee_id)
);

CREATE POLICY "Admins can delete conversations"
ON public.chat_conversations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('manager','mitarbeiter')),
  sender_user_id uuid,
  sent_as_superadmin boolean NOT NULL DEFAULT false,
  content text NOT NULL DEFAULT '',
  edited_at timestamptz,
  deleted_at timestamptz,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_conversation(conversation_id)
);

CREATE POLICY "Participants can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  (
    (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'))
    AND sender_role = 'manager'
  )
  OR (
    public.is_my_conversation(conversation_id)
    AND sender_role = 'mitarbeiter'
    AND sender_user_id = auth.uid()
  )
);

CREATE POLICY "Participants can update messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_conversation(conversation_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_my_conversation(conversation_id)
);

CREATE POLICY "Admins can delete messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Agent settings (singleton)
CREATE TABLE public.chat_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  display_name text NOT NULL DEFAULT 'Daniel Schreiber',
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online','away','offline')),
  status_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.chat_agent_settings TO authenticated;
GRANT ALL ON public.chat_agent_settings TO service_role;

ALTER TABLE public.chat_agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read agent settings"
ON public.chat_agent_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert agent settings"
ON public.chat_agent_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can update agent settings"
ON public.chat_agent_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'));

INSERT INTO public.chat_agent_settings (singleton) VALUES (true);

-- updated_at triggers
CREATE TRIGGER trg_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_chat_agent_settings_updated_at
BEFORE UPDATE ON public.chat_agent_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- keep last_message_at in sync
CREATE OR REPLACE FUNCTION public.chat_touch_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chat_messages_touch
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_touch_conversation();

-- realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_agent_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_agent_settings;
