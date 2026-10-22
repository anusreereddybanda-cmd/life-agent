import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Camera,
  Calendar,
  Heart,
  LoaderCircle,
  Save,
  Trash2,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';
import { formatSupabaseError } from '../utils/supabaseError';

type Profile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  avatar_path: string | null;
};

type ProfileDraft = {
  display_name: string;
  bio: string;
  date_of_birth: string;
};

const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxAvatarSize = 10 * 1024 * 1024;
const avatarExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
}

export default function ProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({
    display_name: '',
    bio: '',
    date_of_birth: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemovePending, setAvatarRemovePending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setErrorMessage('');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user || user.id !== userId) {
          throw new Error('Please sign in again to view your profile.');
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, bio, date_of_birth, avatar_path')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;

        const currentProfile: Profile | null = data;
        let signedAvatarUrl = '';
        if (currentProfile?.avatar_path) {
          if (!currentProfile.avatar_path.startsWith(`${user.id}/`)) {
            throw new Error('The saved profile photo path is not valid for this account.');
          }
          const { data: signedData, error: signedError } = await supabase.storage
            .from('memory-photos')
            .createSignedUrl(currentProfile.avatar_path, 3600);
          if (signedError) throw signedError;
          signedAvatarUrl = signedData.signedUrl;
        }

        if (cancelled) return;
        setProfile(currentProfile);
        setAvatarUrl(signedAvatarUrl);
        setDraft({
          display_name: currentProfile?.display_name ?? '',
          bio: currentProfile?.bio ?? '',
          date_of_birth: currentProfile?.date_of_birth ?? '',
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load your profile.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function beginEditing() {
    setDraft({
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    });
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarRemovePending(false);
    setErrorMessage('');
    setStatusMessage('');
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setDraft({
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    });
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarRemovePending(false);
    setEditing(false);
    setErrorMessage('');
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setErrorMessage('');
    setAvatarPreview('');
    setAvatarRemovePending(false);

    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!allowedAvatarTypes.has(file.type)) {
      setAvatarFile(null);
      setErrorMessage('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size === 0 || file.size > maxAvatarSize) {
      setAvatarFile(null);
      setErrorMessage('The profile photo must be smaller than 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarPreview(reader.result);
    };
    reader.onerror = () => {
      setErrorMessage('Could not preview this image. Please choose another file.');
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
    setAvatarRemovePending(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const displayName = draft.display_name.trim();
    const bio = draft.bio.trim();
    if (displayName.length > 100) {
      setErrorMessage('Name must be 100 characters or fewer.');
      return;
    }
    if (bio.length > 2000) {
      setErrorMessage('Bio must be 2,000 characters or fewer.');
      return;
    }
    if (draft.date_of_birth) {
      const date = new Date(`${draft.date_of_birth}T00:00:00`);
      const earliest = new Date('1900-01-01T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (
        Number.isNaN(date.getTime()) ||
        date < earliest ||
        date > today
      ) {
        setErrorMessage('Enter a valid date of birth.');
        return;
      }
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    let uploadedAvatarPath: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error('Please sign in again before saving your profile.');
      }

      const previousAvatarPath = profile?.avatar_path ?? null;
      let avatarPath = avatarRemovePending
        ? null
        : profile?.avatar_path ?? null;
      let newAvatarUrl = avatarRemovePending ? '' : avatarUrl;
      if (avatarFile) {
        if (!allowedAvatarTypes.has(avatarFile.type) || avatarFile.size > maxAvatarSize) {
          throw new Error('Choose a JPEG, PNG, or WebP image smaller than 10 MB.');
        }

        uploadedAvatarPath = `${user.id}/avatars/${crypto.randomUUID()}.${avatarExtensions[avatarFile.type]}`;
        const { error: uploadError } = await supabase.storage
          .from('memory-photos')
          .upload(uploadedAvatarPath, avatarFile, {
            contentType: avatarFile.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data: signedData, error: signedError } = await supabase.storage
          .from('memory-photos')
          .createSignedUrl(uploadedAvatarPath, 3600);
        if (signedError) throw signedError;
        newAvatarUrl = signedData.signedUrl;
        avatarPath = uploadedAvatarPath;
      }

      const profileValues = {
        display_name: displayName || null,
        bio: bio || null,
        date_of_birth: draft.date_of_birth || null,
        avatar_path: avatarPath,
      };
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileValues)
        .eq('id', user.id)
        .select('id, display_name, bio, date_of_birth, avatar_path')
        .maybeSingle();

      if (updateError) throw updateError;

      let savedProfile: Profile;
      if (updatedProfile) {
        savedProfile = updatedProfile;
      } else {
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...profileValues })
          .select('id, display_name, bio, date_of_birth, avatar_path')
          .single();
        if (insertError) throw insertError;
        savedProfile = insertedProfile;
      }

      setProfile(savedProfile);
      setAvatarUrl(newAvatarUrl);
      setAvatarPreview('');
      setAvatarFile(null);
      setAvatarRemovePending(false);
      setEditing(false);
      uploadedAvatarPath = null;

      let cleanupMessage = '';
      if (previousAvatarPath && previousAvatarPath !== savedProfile.avatar_path) {
        const { error: cleanupError } = await supabase.storage
          .from('memory-photos')
          .remove([previousAvatarPath]);
        if (cleanupError) {
          cleanupMessage = ` The previous profile photo could not be deleted: ${cleanupError.message}`;
        }
      }
      setStatusMessage(`Profile changes saved successfully.${cleanupMessage}`);
    } catch (error) {
      let message = formatSupabaseError(error, 'Could not save your profile.');

      if (uploadedAvatarPath) {
        const { error: cleanupError } = await supabase.storage
          .from('memory-photos')
          .remove([uploadedAvatarPath]);
        if (cleanupError) {
          message += ` The uploaded photo could not be removed: ${formatSupabaseError(cleanupError, 'Unknown Storage error')}`;
        }
      }
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  const displayedAvatar = avatarRemovePending ? '' : avatarPreview || avatarUrl;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">My Profile</h1>
        <p className="text-ink-400">Your profile information.</p>
      </header>

      {loading ? (
        <div className="glass-panel p-8 text-center text-ink-400" role="status">
          Loading your profile...
        </div>
      ) : (
        <div className="glass-panel p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-polaroid rotate-2 bg-cream-100 flex items-center justify-center">
                {displayedAvatar ? (
                  <img
                    src={displayedAvatar}
                    alt="Your profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound size={64} className="text-sage-300" aria-hidden="true" />
                )}
              </div>
              {editing && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="profile-avatar"
                    className="flex cursor-pointer items-center space-x-2 text-sm font-medium text-sage-600 hover:text-sage-700"
                  >
                    <Camera size={16} />
                    <span>
                      {avatarUrl || avatarFile ? 'Change Photo' : 'Choose Photo'}
                    </span>
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                  {(avatarUrl || avatarFile) && !avatarRemovePending && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm('Remove your profile photo?')) return;
                        setAvatarRemovePending(true);
                        setAvatarFile(null);
                        setAvatarPreview('');
                        setErrorMessage('');
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
                    >
                      <Trash2 size={15} />
                      Remove Photo
                    </button>
                  )}
                  {avatarRemovePending && (
                    <button
                      type="button"
                      onClick={() => setAvatarRemovePending(false)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
                    >
                      <Undo2 size={15} />
                      Undo removal
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-8">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-600">Display name</span>
                    <input
                      type="text"
                      value={draft.display_name}
                      onChange={(event) =>
                        setDraft({ ...draft, display_name: event.target.value })
                      }
                      maxLength={100}
                      autoComplete="name"
                      className="w-full rounded-lg border border-cream-300 bg-white p-3"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-600">Date of birth</span>
                    <input
                      type="date"
                      value={draft.date_of_birth}
                      onChange={(event) =>
                        setDraft({ ...draft, date_of_birth: event.target.value })
                      }
                      min="1900-01-01"
                      className="w-full rounded-lg border border-cream-300 bg-white p-3"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-600">About me</span>
                    <textarea
                      value={draft.bio}
                      onChange={(event) =>
                        setDraft({ ...draft, bio: event.target.value })
                      }
                      maxLength={2000}
                      rows={6}
                      className="w-full rounded-lg border border-cream-300 bg-white p-3"
                    />
                    <span className="block text-right text-xs text-ink-400">
                      {draft.bio.length}/2000
                    </span>
                  </label>

                  {errorMessage && (
                    <p role="alert" className="text-sm text-red-700">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-full border border-cream-300 px-5 py-3 text-ink-600 hover:bg-cream-100 disabled:opacity-50"
                    >
                      <X size={17} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="border-b border-cream-300 pb-6">
                    <h2 className="text-3xl font-serif mb-2">
                      {profile?.display_name || 'Name not added'}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-ink-400">
                      {profile?.date_of_birth && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={16} />
                          {formatDate(profile.date_of_birth)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-serif flex items-center gap-2 text-sage-700">
                      <Heart size={20} /> About Me
                    </h3>
                    <div className="bg-cream-50 p-6 rounded-lg border border-cream-200 min-h-24">
                      <p className="text-ink-500 leading-relaxed whitespace-pre-wrap">
                        {profile?.bio || 'No bio added yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap justify-end gap-4">
                    {statusMessage && (
                      <p role="status" className="mr-auto self-center text-sm text-sage-700">
                        {statusMessage}
                      </p>
                    )}
                    {errorMessage && (
                      <p role="alert" className="mr-auto self-center text-sm text-red-700">
                        {errorMessage}
                      </p>
                    )}
                    <button type="button" onClick={beginEditing} className="btn-primary">
                      Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
