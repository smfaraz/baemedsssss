import { adminSupabase } from '../server/adminSupabase';

async function provisionAdmin() {
  console.log('--- Connecting to Supabase with Service Role ---');

  // 1. Check existing auth users
  const { data: usersData, error: usersErr } = await adminSupabase.auth.admin.listUsers();
  if (usersErr) {
    console.error('Failed to list auth users:', usersErr.message);
  } else {
    console.log(`Found ${usersData.users.length} users in auth.users:`);
    for (const u of usersData.users) {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
    }
  }

  // 2. Ensure admin@baemeds.com exists in auth.users
  const users = usersData?.users || [];
  let adminUser = users.find(u => u.email?.toLowerCase() === 'admin@baemeds.com');

  if (!adminUser) {
    console.log('\nCreating admin@baemeds.com in Supabase auth...');
    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: 'admin@baemeds.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'Super Admin' }
    });
    if (createErr) {
      console.error('Failed to create admin@baemeds.com:', createErr.message);
    } else if (created.user) {
      adminUser = created.user;
      console.log('Successfully created admin@baemeds.com with ID:', adminUser.id);
    }
  } else {
    console.log('\nadmin@baemeds.com already exists in auth.users with ID:', adminUser.id);
    // Optionally ensure password is set to password123 so login always works
    await adminSupabase.auth.admin.updateUserById(adminUser.id, {
      password: 'password123',
      email_confirm: true
    });
    console.log('Updated admin@baemeds.com password to standard default.');
  }

  // 3. For every user found in auth.users (or specifically all users if few, or adminUser), provision into public.admin_users and public.user_roles
  const targetUsers = users.length > 0 ? users : (adminUser ? [adminUser] : []);

  for (const u of targetUsers) {
    console.log(`\nProvisioning admin access for: ${u.email} (${u.id})`);

    // Upsert into public.admin_users
    const { error: adminErr } = await adminSupabase
      .from('admin_users')
      .upsert({ user_id: u.id }, { onConflict: 'user_id' });

    if (adminErr) {
      console.error(`Error adding to admin_users:`, adminErr.message);
    } else {
      console.log(`✔ Added ${u.email} to public.admin_users`);
    }

    // Upsert into public.user_roles
    const { error: roleErr } = await adminSupabase
      .from('user_roles')
      .upsert({ user_id: u.id, role: 'super_admin' }, { onConflict: 'user_id' });

    if (roleErr) {
      console.error(`Error setting user_roles:`, roleErr.message);
    } else {
      console.log(`✔ Set role 'super_admin' in public.user_roles for ${u.email}`);
    }
  }

  // 4. Verify the tables now
  const { data: currentAdminUsers } = await adminSupabase.from('admin_users').select('*');
  console.log('\n--- Current public.admin_users table ---');
  console.log(currentAdminUsers);

  const { data: currentUserRoles } = await adminSupabase.from('user_roles').select('*');
  console.log('\n--- Current public.user_roles table ---');
  console.log(currentUserRoles);

  console.log('\nPROVISIONING COMPLETE!');
}

provisionAdmin().catch(console.error);
