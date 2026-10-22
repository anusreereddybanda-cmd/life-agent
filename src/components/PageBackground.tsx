import {
  Check,
  ImagePlus,
  LoaderCircle,
  Paintbrush,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { supabase } from '../supabase';
import { formatSupabaseError } from '../utils/supabaseError';

type BackgroundColumn =
  | 'memories_background_path'
  | 'gallery_background_path'
  | 'timeline_background_path';

const bucket = 'memory-photos';
const maxSize = 10 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const columnLabels: Record<BackgroundColumn, string> = {
  memories_background_path: 'Memories',
  gallery_background_path: 'Gallery',
  timeline_background_path: 'Timeline',
};

export default function PageBackground({
  userId,
  column,
  children,
}: {
  userId: string;
  column: BackgroundColumn;
  children: ReactNode;
}) {
  const [savedPath, setSavedPath] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pathPrefix = `${userId}/page-backgrounds/${column}/`;

  useEffect(() => {
    let cancelled = false;

    async function loadBackground() {
      setLoading(true);
      setError('');
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user || user.id !== userId) {
          throw new Error('Please sign in again to load your background.');
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select(column)
          .eq('id', user.id)
          .maybeSingle();
        if (queryError) throw queryError;

        const profilePaths = data as Record<BackgroundColumn, string | null> | null;
        const path = profilePaths?.[column] ?? null;
        let signedUrl = '';
        if (path) {
          if (!path.startsWith(pathPrefix)) {
            throw new Error('The saved background path is invalid for this page.');
          }
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);
          if (signedError) throw signedError;
          signedUrl = signedData.signedUrl;
        }

        if (!cancelled) {
          setSavedPath(path ?? '');
          setBackgroundUrl(signedUrl);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            formatSupabaseError(
              loadError,
              `Could not load the ${columnLabels[column]} background.`
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBackground();
    return () => {
      cancelled = true;
    };
  }, [column, pathPrefix, userId]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function closeDialog() {
    if (saving || removing) return;
    setDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setError('');
    setStatus('');
    setSelectedFile(null);
    setPreviewUrl('');
    if (!file) return;

    if (!allowedTypes.has(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size === 0 || file.size > maxSize) {
      setError('The background image must be smaller than 10 MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function saveBackground() {
    if (!selectedFile || saving) return;
    setSaving(true);
    setError('');
    setStatus('');
    let uploadedPath = '';
    let operation = 'checking your sign-in';

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error('Please sign in again before saving a background.');
      }

      operation = 'checking the profile background field';
      const { error: preflightError } = await supabase
        .from('profiles')
        .select(column)
        .eq('id', user.id)
        .maybeSingle();
      if (preflightError) throw preflightError;

      if (!allowedTypes.has(selectedFile.type) || selectedFile.size > maxSize) {
        throw new Error('Choose a JPEG, PNG, or WebP image smaller than 10 MB.');
      }

      operation = 'uploading the image to private storage';
      uploadedPath = `${user.id}/page-backgrounds/${column}/${crypto.randomUUID()}.${extensions[selectedFile.type]}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uploadedPath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      operation = 'creating a private preview URL';
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(uploadedPath, 3600);
      if (signedError) throw signedError;

      operation = 'saving the background on your profile';
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: uploadedPath })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, [column]: uploadedPath });
        if (insertError) throw insertError;
      }

      const previousPath = savedPath;
      setSavedPath(uploadedPath);
      setBackgroundUrl(signedData.signedUrl);
      setSelectedFile(null);
      setPreviewUrl('');
      setDialogOpen(false);
      setStatus(`${columnLabels[column]} background saved.`);
      uploadedPath = '';

      if (previousPath) {
        operation = 'removing the previous background image';
        const { error: cleanupError } = await supabase.storage
          .from(bucket)
          .remove([previousPath]);
        if (cleanupError) {
          setError(
            `Background saved, but the previous image could not be removed: ${formatSupabaseError(cleanupError, 'Unknown Storage error')}`
          );
        }
      }
    } catch (saveError) {
      let message = formatSupabaseError(
        saveError,
        `Could not complete the step for ${operation}.`
      );
      if (/memories_background_path|gallery_background_path|timeline_background_path/i.test(message)) {
        message += ' Apply supabase/migrations/0009_profile_page_backgrounds.sql in your Supabase SQL Editor, then reload the page.';
      } else if (/bucket|memory-photos/i.test(message)) {
        message += ' Confirm migrations 0007 and 0009 are applied and that the memory-photos bucket is private with the per-user Storage policies.';
      }
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from(bucket)
          .remove([uploadedPath]);
        if (cleanupError) {
          message += ` The new upload could not be removed: ${cleanupError.message}`;
        }
      }
      setError(`${message} (While ${operation}.)`);
    } finally {
      setSaving(false);
    }
  }

  async function removeBackground() {
    if (!savedPath || removing) return;
    if (!window.confirm(`Remove the ${columnLabels[column]} background?`)) return;
    setRemoving(true);
    setError('');
    setStatus('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error('Please sign in again before removing this background.');
      }
      if (!savedPath.startsWith(pathPrefix)) {
        throw new Error('The saved background path is invalid for this page.');
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: null })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error('The background setting was not removed.');

      setSavedPath('');
      setBackgroundUrl('');
      setStatus(`${columnLabels[column]} background removed.`);
      setDialogOpen(false);

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([savedPath]);
      if (storageError) {
        setError(
          `The background setting was removed, but its private image could not be deleted: ${formatSupabaseError(storageError, 'Unknown Storage error')}`
        );
      }
    } catch (removeError) {
      setError(formatSupabaseError(removeError, 'Could not remove this background.'));
    } finally {
      setRemoving(false);
    }
  }

  const visibleBackground = previewUrl || backgroundUrl;
  const shellStyle = visibleBackground
    ? {
        backgroundImage: `linear-gradient(rgba(250, 248, 245, 0.82), rgba(250, 248, 245, 0.82)), url("${visibleBackground}")`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed' as const,
      }
    : undefined;

  return (
    <div
      className="page-background-shell relative space-y-5 rounded-3xl p-3 sm:p-6"
      style={shellStyle}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="min-h-5 text-sm">
          {loading && (
            <span className="inline-flex items-center gap-2 text-ink-400">
              <LoaderCircle size={15} className="animate-spin" />
              Loading background...
            </span>
          )}
          {status && <span role="status" className="text-sage-700">{status}</span>}
          {error && !dialogOpen && (
            <span role="alert" className="text-red-700">{error}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setDialogOpen(true);
            setError('');
          }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-sm font-medium text-violet-900 shadow-sm transition hover:bg-violet-50"
        >
          <Paintbrush size={16} />
          Customize Background
        </button>
      </div>

      {children}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-900/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="background-dialog-title"
            className="w-full max-w-lg rounded-2xl border border-violet-100 bg-cream-50 p-5 shadow-xl sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-700">
                  Personalize this page
                </p>
                <h2
                  id="background-dialog-title"
                  className="mt-1 text-2xl font-serif text-ink-900"
                >
                  {columnLabels[column]} background
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving || removing}
                aria-label="Cancel background customization"
                className="rounded-full p-2 text-ink-500 hover:bg-cream-200 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mb-5 flex aspect-[16/8] items-center justify-center overflow-hidden rounded-xl border border-cream-200 bg-white">
              {visibleBackground ? (
                <img
                  src={visibleBackground}
                  alt="Background preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="px-5 text-center text-sm text-ink-400">
                  Choose an image to preview your page background.
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Choose background image"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || removing}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-50"
              >
                <ImagePlus size={16} />
                {savedPath || selectedFile ? 'Change Background' : 'Choose Image'}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => void saveBackground()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
              {savedPath && !selectedFile && (
                <button
                  type="button"
                  onClick={() => void removeBackground()}
                  disabled={removing || saving}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {removing ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {removing ? 'Removing...' : 'Remove Background'}
                </button>
              )}
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving || removing}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-cream-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              JPEG, PNG, or WebP · up to 10 MB. Your page uses a light overlay
              to keep its content readable.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
