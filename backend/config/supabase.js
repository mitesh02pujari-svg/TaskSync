const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    'Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.'
  );
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

module.exports = supabase;