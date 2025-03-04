-- Функция для добавления монет пользователю и создания записи в транзакциях
CREATE OR REPLACE FUNCTION add_coins(
  p_user_id UUID, 
  p_amount NUMERIC, 
  p_description TEXT
) RETURNS VOID AS $$
DECLARE
  v_balance_id UUID;
BEGIN
  -- Получаем ID записи баланса
  SELECT id INTO v_balance_id
  FROM balances
  WHERE user_id = p_user_id AND currency = 'coins';
  
  -- Если записи нет, создаем
  IF v_balance_id IS NULL THEN
    INSERT INTO balances (user_id, amount, currency)
    VALUES (p_user_id, p_amount, 'coins')
    RETURNING id INTO v_balance_id;
  ELSE
    -- Обновляем существующий баланс
    UPDATE balances
    SET amount = amount + p_amount, updated_at = NOW()
    WHERE id = v_balance_id;
  END IF;
  
  -- Создаем запись в транзакциях
  INSERT INTO transactions (
    user_id,
    amount, 
    currency, 
    type, 
    description
  ) VALUES (
    p_user_id,
    p_amount,
    'coins',
    'referral',
    p_description
  );
END;
$$ LANGUAGE plpgsql;