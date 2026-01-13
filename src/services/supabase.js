import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ospvpdmpjznebrsxdgdd.supabase.co';
const supabaseAnonKey = 'sb_publishable_p1GzHw_kM_paC3HDn6FRew_4Npkc5cP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// Auth Functions
// ==========================================

/**
 * Sign up a new user
 */
export async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role: 'user' // Default role
            }
        }
    });

    if (error) throw error;

    // Create profile in profiles table
    if (data.user) {
        await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            name,
            role: 'user'
        });
    }

    return data;
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Create or update profile for OAuth users
 */
export async function createOrUpdateProfile(user) {
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!existingProfile) {
        // Create new profile
        await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            role: 'user',
            avatar_url: user.user_metadata?.avatar_url
        });
    }

    return existingProfile;
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

/**
 * Get current user profile with role
 */
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// User Management (Admin)
// ==========================================

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId, newRole) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId) {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) throw error;
}

// ==========================================
// Matches (Game Favorites)
// ==========================================

/**
 * Save a match (liked game)
 */
export async function saveMatch(userId, game) {
    const { data, error } = await supabase
        .from('matches')
        .insert({
            user_id: userId,
            game_id: game.id,
            game_name: game.name,
            game_image: game.image,
            game_genres: game.genres,
            game_rating: game.rating
        })
        .select()
        .single();

    if (error && error.code !== '23505') throw error; // Ignore duplicate
    return data;
}

/**
 * Get user's matches
 */
export async function getUserMatches(userId) {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Remove a match
 */
export async function removeMatch(userId, gameId) {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);

    if (error) throw error;
}

/**
 * Get match statistics (admin)
 */
export async function getMatchStats() {
    const { data, error } = await supabase
        .from('matches')
        .select('game_name, game_id')
        .order('game_name');

    if (error) throw error;

    // Count occurrences
    const counts = {};
    data.forEach(m => {
        counts[m.game_name] = (counts[m.game_name] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

export default supabase;
