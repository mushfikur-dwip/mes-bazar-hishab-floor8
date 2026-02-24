
-- Fix ALL restrictive policies to be PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- activity_logs
DROP POLICY IF EXISTS "Authenticated can read activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated can read activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only triggers can insert activity logs" ON public.activity_logs;
CREATE POLICY "Only triggers can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (false);

-- balance_ledger
DROP POLICY IF EXISTS "Admin can manage balances" ON public.balance_ledger;
CREATE POLICY "Admin can manage balances" ON public.balance_ledger FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can read all balances" ON public.balance_ledger;
CREATE POLICY "Admin can read all balances" ON public.balance_ledger FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can read own balance" ON public.balance_ledger;
CREATE POLICY "Users can read own balance" ON public.balance_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());

-- bazar_entries
DROP POLICY IF EXISTS "Admin can manage bazar entries" ON public.bazar_entries;
CREATE POLICY "Admin can manage bazar entries" ON public.bazar_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read bazar entries" ON public.bazar_entries;
CREATE POLICY "Authenticated can read bazar entries" ON public.bazar_entries FOR SELECT TO authenticated USING (true);

-- bazar_rotation
DROP POLICY IF EXISTS "Admin can manage rotation" ON public.bazar_rotation;
CREATE POLICY "Admin can manage rotation" ON public.bazar_rotation FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read rotation" ON public.bazar_rotation;
CREATE POLICY "Authenticated can read rotation" ON public.bazar_rotation FOR SELECT TO authenticated USING (true);

-- extra_costs
DROP POLICY IF EXISTS "Admin can manage extra costs" ON public.extra_costs;
CREATE POLICY "Admin can manage extra costs" ON public.extra_costs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read extra costs" ON public.extra_costs;
CREATE POLICY "Authenticated can read extra costs" ON public.extra_costs FOR SELECT TO authenticated USING (true);

-- meal_cutoff_settings
DROP POLICY IF EXISTS "Admin can manage cutoff settings" ON public.meal_cutoff_settings;
CREATE POLICY "Admin can manage cutoff settings" ON public.meal_cutoff_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read cutoff settings" ON public.meal_cutoff_settings;
CREATE POLICY "Authenticated can read cutoff settings" ON public.meal_cutoff_settings FOR SELECT TO authenticated USING (true);

-- meal_entries
DROP POLICY IF EXISTS "Admin can manage meal entries" ON public.meal_entries;
CREATE POLICY "Admin can manage meal entries" ON public.meal_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read meal entries" ON public.meal_entries;
CREATE POLICY "Authenticated can read meal entries" ON public.meal_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can upsert own meals" ON public.meal_entries;
CREATE POLICY "Members can upsert own meals" ON public.meal_entries FOR ALL TO authenticated USING (user_id = auth.uid() AND date >= CURRENT_DATE) WITH CHECK (user_id = auth.uid() AND date >= CURRENT_DATE);

-- meal_weight_settings
DROP POLICY IF EXISTS "Admin can manage meal weights" ON public.meal_weight_settings;
CREATE POLICY "Admin can manage meal weights" ON public.meal_weight_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read meal weights" ON public.meal_weight_settings;
CREATE POLICY "Authenticated can read meal weights" ON public.meal_weight_settings FOR SELECT TO authenticated USING (true);

-- member_month_status
DROP POLICY IF EXISTS "Admin can manage month status" ON public.member_month_status;
CREATE POLICY "Admin can manage month status" ON public.member_month_status FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read month status" ON public.member_month_status;
CREATE POLICY "Authenticated can read month status" ON public.member_month_status FOR SELECT TO authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "Admin can insert notifications" ON public.notifications;
CREATE POLICY "Admin can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can manage all notifications" ON public.notifications;
CREATE POLICY "Admin can manage all notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- payments
DROP POLICY IF EXISTS "Admin can manage payments" ON public.payments;
CREATE POLICY "Admin can manage payments" ON public.payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read payments" ON public.payments;
CREATE POLICY "Authenticated can read payments" ON public.payments FOR SELECT TO authenticated USING (true);

-- reminder_settings
DROP POLICY IF EXISTS "Admin can manage reminder settings" ON public.reminder_settings;
CREATE POLICY "Admin can manage reminder settings" ON public.reminder_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read reminder settings" ON public.reminder_settings;
CREATE POLICY "Authenticated can read reminder settings" ON public.reminder_settings FOR SELECT TO authenticated USING (true);

-- user_roles
DROP POLICY IF EXISTS "Admin can delete roles" ON public.user_roles;
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can insert roles" ON public.user_roles;
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can read all roles" ON public.user_roles;
CREATE POLICY "Admin can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
