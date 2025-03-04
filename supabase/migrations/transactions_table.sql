-- Создаем пользовательский тип для транзакций
CREATE TYPE transaction_type AS ENUM ('bet', 'win', 'loss', 'referral', 'bonus', 'admin');

-- Создаем таблицу транзакций
CREATE TABLE public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null,
  currency text not null default 'coins'::text,
  type transaction_type not null,
  description text null,
  related_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references users (id)
) TABLESPACE pg_default;