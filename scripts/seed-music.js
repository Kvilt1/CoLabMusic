/**
 * Temp script to create a vault and seed music files with metadata
 * Run with: node scripts/seed-music.js
 */

import { createClient } from '@supabase/supabase-js';
import { parseFile } from 'music-metadata';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase config (same as in supabaseClient.js)
const supabaseUrl = 'https://ctfbpavgdlqqesdoyhfb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0ZmJwYXZnZGxxcWVzZG95aGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODgzOTAsImV4cCI6MjA4MTA2NDM5MH0.o76Xr4pAhircqHSmC4oLtVkWxCc5WhfldrvWHM2JwtY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = 'admin@admin.com';
const VAULT_NAME = 'Rokur Beats';
const MUSIC_DIR = path.join(__dirname, '..', 'music');

// Helper to format duration
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to generate random color for vault
function getRandomVaultColor() {
    const colors = [
        'from-purple-600 to-indigo-600',
        'from-blue-500 to-cyan-500',
        'from-red-600 to-orange-600',
        'from-emerald-600 to-teal-600',
        'from-orange-500 to-amber-500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Generate invite code
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function main() {
    console.log('🎵 CoLab Music Seeder\n');

    // Step 1: Find admin user
    console.log(`1. Looking for user: ${ADMIN_EMAIL}`);
    
    const { data: members, error: memberError } = await supabase
        .from('vault_members')
        .select('user_id')
        .eq('email', ADMIN_EMAIL)
        .limit(1);

    let adminUserId = members?.[0]?.user_id;

    if (!adminUserId) {
        console.log('   ⚠️  Admin user not found in vault_members.');
        console.log('   Please make sure admin@admin.com has logged in at least once.');
        console.log('   Trying to continue anyway...\n');
        
        // Use a placeholder - the vault creation might still work if RLS allows
        adminUserId = '548145f1-e579-407c-9290-2e2b350ba676'; // Known admin ID from previous run
    } else {
        console.log(`   ✓ Found admin user: ${adminUserId}`);
    }

    // Step 2: Check if vault already exists
    console.log(`\n2. Checking for existing vault: "${VAULT_NAME}"`);
    
    const { data: existingVault } = await supabase
        .from('vaults')
        .select('*')
        .eq('name', VAULT_NAME)
        .single();

    let vault = existingVault;

    if (existingVault) {
        console.log(`   ✓ Using existing vault: ${existingVault.id}`);
    } else {
        // Create new vault
        console.log(`   Creating new vault...`);
        
        const { data: newVault, error: vaultError } = await supabase
            .from('vaults')
            .insert([{
                name: VAULT_NAME,
                color: getRandomVaultColor(),
                owner_id: adminUserId,
                invite_code: generateInviteCode(),
                is_private: false
            }])
            .select()
            .single();

        if (vaultError) {
            console.error('   ✗ Error creating vault:', vaultError.message);
            return;
        }

        vault = newVault;
        console.log(`   ✓ Created vault: ${vault.id}`);

        // Add owner to vault_members
        console.log('\n3. Adding owner to vault members...');
        
        const { error: addMemberError } = await supabase
            .from('vault_members')
            .insert([{
                vault_id: vault.id,
                user_id: adminUserId,
                role: 'owner',
                status: 'active',
                display_name: 'Admin',
                email: ADMIN_EMAIL
            }]);

        if (addMemberError && !addMemberError.message.includes('duplicate')) {
            console.log(`   ⚠️  Warning: ${addMemberError.message}`);
        } else {
            console.log('   ✓ Owner added to vault members');
        }
    }

    // Step 4: Seed songs
    await seedSongs(vault.id);
}

async function seedSongs(vaultId) {
    console.log('\n4. Processing music files...\n');

    // Get all audio files
    const files = fs.readdirSync(MUSIC_DIR).filter(f => 
        f.endsWith('.m4a') || f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.flac')
    );

    console.log(`   Found ${files.length} audio files\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const filePath = path.join(MUSIC_DIR, file);
        
        try {
            // Parse metadata
            const metadata = await parseFile(filePath);
            
            // Get title from metadata or clean up filename
            const title = metadata.common.title || 
                         file.replace(/\.[^/.]+$/, '')
                             .split('-')
                             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                             .join(' ');
            
            // Get artists - join with semicolon as requested
            const artists = metadata.common.artists?.join('; ') || 
                           metadata.common.artist || 
                           'Unknown Artist';
            
            const album = metadata.common.album || '';
            const durationSec = metadata.format.duration || 0;
            const duration = formatDuration(durationSec);

            console.log(`   📀 ${title}`);
            console.log(`      Artist(s): ${artists}`);
            console.log(`      Duration: ${duration}`);

            // Upload file to Supabase Storage
            const fileName = `${Date.now()}-${file.replace(/\s+/g, '-')}`;
            const fileBuffer = fs.readFileSync(filePath);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('Music')
                .upload(fileName, fileBuffer, {
                    contentType: 'audio/mp4',
                    upsert: true
                });

            if (uploadError) {
                console.log(`      ✗ Upload failed: ${uploadError.message}`);
                errorCount++;
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('Music')
                .getPublicUrl(fileName);

            const audioUrl = urlData.publicUrl;

            // Insert song record (using correct schema)
            const { error: songError } = await supabase
                .from('songs')
                .insert([{
                    title,
                    artist: artists,
                    album: album || null,
                    duration,
                    url: audioUrl,
                    group_id: vaultId  // This is text type in DB
                }]);

            if (songError) {
                console.log(`      ✗ DB insert failed: ${songError.message}`);
                errorCount++;
            } else {
                console.log(`      ✓ Uploaded successfully\n`);
                successCount++;
            }

        } catch (err) {
            console.log(`   ✗ Error processing ${file}: ${err.message}\n`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Complete! ${successCount} songs uploaded, ${errorCount} errors`);
    console.log('='.repeat(50));
}

main().catch(console.error);
