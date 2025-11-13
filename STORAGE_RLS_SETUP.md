# Supabase Storage RLS Policy Setup

## Critical: Manual Configuration Required

The `content-images` storage bucket requires Row-Level Security (RLS) policies to be configured manually through the Supabase Dashboard. These policies cannot be created via SQL due to Supabase storage schema restrictions.

## Why This Is Needed

Without proper RLS policies, image uploads will fail with:
```
Error: new row violates row-level security policy
```

## Setup Instructions

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click on the **content-images** bucket
5. Click on the **Policies** tab

### 2. Create the Following Policies

#### Policy 1: Allow Authenticated Users to INSERT Images

- **Policy Name**: `Allow authenticated users to upload images`
- **Allowed Operation**: INSERT
- **Target Roles**: `authenticated`
- **Policy Definition**:
  ```sql
  (bucket_id = 'content-images' AND auth.role() = 'authenticated')
  ```

#### Policy 2: Allow Public Read Access to Images

- **Policy Name**: `Allow public read access to images`
- **Allowed Operation**: SELECT
- **Target Roles**: `public`, `authenticated`
- **Policy Definition**:
  ```sql
  (bucket_id = 'content-images')
  ```

#### Policy 3: Allow Authenticated Users to UPDATE Images

- **Policy Name**: `Allow authenticated users to update images`
- **Allowed Operation**: UPDATE
- **Target Roles**: `authenticated`
- **Policy Definition**:
  ```sql
  (bucket_id = 'content-images' AND auth.role() = 'authenticated')
  ```

#### Policy 4: Allow Authenticated Users to DELETE Images

- **Policy Name**: `Allow authenticated users to delete images`
- **Allowed Operation**: DELETE
- **Target Roles**: `authenticated`
- **Policy Definition**:
  ```sql
  (bucket_id = 'content-images' AND auth.role() = 'authenticated')
  ```

### 3. Verify Policies

After creating the policies, verify they are active:

1. Check that all 4 policies appear in the Policies list
2. Ensure each policy shows as "Enabled"
3. Test image upload functionality in the content form

## Alternative: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed and configured, you can create these policies programmatically. However, the Dashboard method is recommended for clarity and ease of verification.

## Troubleshooting

### Error: "new row violates row-level security policy"

- **Cause**: RLS policies not configured or disabled
- **Solution**: Follow the setup instructions above

### Images Upload but Cannot Be Accessed

- **Cause**: SELECT policy not configured correctly
- **Solution**: Ensure Policy 2 (public read access) is enabled

### Cannot Delete or Update Images

- **Cause**: UPDATE/DELETE policies not configured
- **Solution**: Ensure Policies 3 and 4 are enabled

## Security Considerations

- **Public Read Access**: Images are publicly accessible via URL. This is intentional for content display.
- **Authenticated Upload**: Only authenticated users can upload images. This prevents abuse.
- **No User-Specific Restrictions**: Any authenticated user can upload/update/delete any image in the bucket. For production, you may want to add user ownership checks.

## Production Enhancement (Optional)

For production environments, consider adding user ownership validation:

```sql
-- Example: Only allow users to delete their own uploads
(bucket_id = 'content-images' AND auth.uid() = (storage.foldername(name))[1]::uuid)
```

This requires organizing files in user-specific folders (e.g., `{user_id}/filename.jpg`).

## Related Files

- Image upload implementation: `/apps/dashboard/lib/tiptap-utils.ts` (line 356-406)
- Rich text editor: `/apps/dashboard/components/tiptap-templates/simple/simple-editor.tsx`
- Content form: `/apps/dashboard/components/agent/content-form.tsx`

## Status Tracking

- [ ] Policy 1 (INSERT) created
- [ ] Policy 2 (SELECT) created
- [ ] Policy 3 (UPDATE) created
- [ ] Policy 4 (DELETE) created
- [ ] Policies verified as enabled
- [ ] Image upload tested successfully
