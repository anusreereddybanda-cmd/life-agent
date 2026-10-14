
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  FolderOpen,
  ImagePlus,
  Images,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';

type Album = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  cover_storage_path: string | null;
  created_at: string;
};

type Photo = {
  id: string;
  user_id: string;
  album_id: string | null;
  storage_path: string;
  file_name: string | null;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
  imageUrl?: string;
};

const BUCKET = 'memory-photos';

export default function GalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUser = useCallback(async () => {
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!data.user) throw new Error('Please log in to use your gallery.');

    return data.user;
  }, []);

  const loadAlbums = useCallback(async () => {
    const user = await getUser();

    const { data, error: queryError } = await supabase
      .from('albums')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    setAlbums((data ?? []) as Album[]);
  }, [getUser]);

  const loadPhotos = useCallback(async (album: Album) => {
    const user = await getUser();

    const { data, error: queryError } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('album_id', album.id)
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    const rows = (data ?? []) as Photo[];

    const photosWithUrls = await Promise.all(
      rows.map(async (photo) => {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(BUCKET)
            .createSignedUrl(photo.storage_path, 3600);

        if (signedError) {
          console.error('Could not create photo URL:', signedError.message);
          return photo;
        }

        return { ...photo, imageUrl: signedData.signedUrl };
      }),
    );

    setPhotos(photosWithUrls);
  }, [getUser]);

  const refreshGallery = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await loadAlbums();

      if (activeAlbum) {
        await loadPhotos(activeAlbum);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load the gallery.',
      );
    } finally {
      setLoading(false);
    }
  }, [activeAlbum, loadAlbums, loadPhotos]);

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      setLoading(true);
      setError('');

      try {
        const user = await getUser();

        const { data, error: queryError } = await supabase
          .from('albums')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        if (!cancelled) setAlbums((data ?? []) as Album[]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load albums.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [getUser]);

  const openAlbum = async (album: Album) => {
    setActiveAlbum(album);
    setPhotos([]);
    setLoading(true);
    setError('');
    setStatus('');

    try {
      await loadPhotos(album);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load album photos.',
      );
    } finally {
      setLoading(false);
    }
  };

  const backToAlbums = () => {
    setActiveAlbum(null);
    setPhotos([]);
    setError('');
    setStatus('');
    setShowCreateForm(false);
  };

  const createAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');

    const title = albumTitle.trim();

    if (!title) {
      setError('Please enter an album name.');
      return;
    }

    setCreatingAlbum(true);

    try {
      const user = await getUser();

      const { data, error: insertError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title,
          description: albumDescription.trim() || null,
          event_date: eventDate || null,
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      const newAlbum = data as Album;

      setAlbums((previous) => [newAlbum, ...previous]);
      setAlbumTitle('');
      setAlbumDescription('');
      setEventDate('');
      setShowCreateForm(false);
      setStatus(`Album "${newAlbum.title}" created successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create the album.',
      );
    } finally {
      setCreatingAlbum(false);
    }
  };

  const uploadPhotos = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!activeAlbum) {
      setError('Open an album before uploading photos.');
      return;
    }

    const files = fileInputRef.current?.files;

    if (!files || files.length === 0) {
      setError('Please select one or more photos first.');
      return;
    }

    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith('image/'),
    );

    if (invalidFile) {
      setError('Please select image files only.');
      return;
    }

    setUploading(true);

    let successfulUploads = 0;
    const uploadErrors: string[] = [];

    try {
      const user = await getUser();

      for (const file of selectedFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath =
          `${user.id}/${crypto.randomUUID()}-${safeName}`;

        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (storageError) {
          uploadErrors.push(`${file.name}: ${storageError.message}`);
          continue;
        }

        const { error: metadataError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            album_id: activeAlbum.id,
            storage_path: storagePath,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          });

        if (metadataError) {
          uploadErrors.push(`${file.name}: ${metadataError.message}`);

          // Remove the uploaded file if its database record failed.
          const { error: cleanupError } = await supabase.storage
            .from(BUCKET)
            .remove([storagePath]);

          if (cleanupError) {
            console.error('Storage cleanup failed:', cleanupError.message);
          }

          continue;
        }

        successfulUploads += 1;
      }

      if (fileInputRef.current) fileInputRef.current.value = '';

      await loadPhotos(activeAlbum);
      await loadAlbums();

      if (uploadErrors.length === 0) {
        setStatus(
          `${successfulUploads} photo(s) uploaded to "${activeAlbum.title}".`,
        );
      } else {
        setError(
          `${successfulUploads} photo(s) uploaded. Some files failed:\n` +
            uploadErrors.join('\n'),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Photo upload failed.',
      );
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: Photo) => {
    const confirmed = window.confirm(
      `Delete "${photo.file_name || 'this photo'}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingPhoto(photo.id);
    setError('');
    setStatus('');

    try {
      const user = await getUser();

      if (photo.user_id !== user.id) {
        throw new Error('You can only delete your own photos.');
      }

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setPhotos((previous) => previous.filter((item) => item.id !== photo.id));
      setStatus('Photo deleted successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete the photo.',
      );
    } finally {
      setDeletingPhoto(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(`${date}T00:00:00`).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {activeAlbum && (
            <button
              type="button"
              onClick={backToAlbums}
              className="rounded-xl border border-gray-200 p-2 transition hover:bg-gray-100"
              aria-label="Back to albums"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeAlbum ? activeAlbum.title : 'My Gallery'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeAlbum
                ? activeAlbum.description || 'Photos from this event'
                : 'Keep your favourite moments and memories together.'}
            </p>
          </div>
        </div>

        {!activeAlbum && (
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((value) => !value);
              setError('');
              setStatus('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white transition hover:bg-gray-700"
          >
            {showCreateForm ? <X size={18} /> : <Plus size={18} />}
            {showCreateForm ? 'Cancel' : 'Create Album'}
          </button>
        )}

        {activeAlbum && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
            Add Photos
          </button>
        )}
      </div>

      {status && (
        <div
          role="status"
          className="whitespace-pre-line rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {status}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!activeAlbum && showCreateForm && (
        <form
          onSubmit={createAlbum}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Create an event album
          </h2>

          <div className="space-y-1.5">
            <label
              htmlFor="album-title"
              className="block text-sm font-medium text-gray-700"
            >
              Album name *
            </label>
            <input
              id="album-title"
              type="text"
              maxLength={100}
              required
              value={albumTitle}
              onChange={(event) => setAlbumTitle(event.target.value)}
              placeholder="e.g. Birthday, College Memories, Freshers Party"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="album-description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="album-description"
              rows={3}
              value={albumDescription}
              onChange={(event) => setAlbumDescription(event.target.value)}
              placeholder="Write a little about this event..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="album-date"
              className="block text-sm font-medium text-gray-700"
            >
              Event date (optional)
            </label>
            <input
              id="album-date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={creatingAlbum}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {creatingAlbum && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            {creatingAlbum ? 'Creating...' : 'Create Album'}
          </button>
        </form>
      )}

      {activeAlbum && (
        <form onSubmit={uploadPhotos} className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={() => {
              setError('');
              setStatus('');
            }}
            className="block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:font-medium"
          />

          <p className="text-sm text-gray-500">
            Select multiple photos together. They will be saved in this album.
          </p>

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            {uploading ? 'Uploading photos...' : 'Upload Selected Photos'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <LoaderCircle size={22} className="animate-spin" />
          Loading gallery...
        </div>
      ) : activeAlbum ? (
        photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
            <ImagePlus className="mx-auto mb-3 text-gray-400" size={42} />
            <h2 className="font-semibold text-gray-800">No photos yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose photos above to add memories to this album.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                {photo.imageUrl ? (
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || photo.file_name || 'Gallery photo'}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-gray-100 text-sm text-gray-500">
                    Image unavailable
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 p-2.5">
                  <span className="min-w-0 truncate text-xs text-gray-600">
                    {photo.file_name || 'Photo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deletePhoto(photo)}
                    disabled={deletingPhoto === photo.id}
                    aria-label="Delete photo"
                    title="Delete photo"
                    className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingPhoto === photo.id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : albums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
          <Images className="mx-auto mb-3 text-gray-400" size={44} />
          <h2 className="font-semibold text-gray-800">Create your first album</h2>
          <p className="mt-1 text-sm text-gray-500">
            Make an album for birthdays, college memories, trips, or special events.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            Create Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => void openAlbum(album)}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition group-hover:bg-gray-200">
                <FolderOpen size={28} />
              </div>

              <h2 className="truncate text-lg font-semibold text-gray-900">
                {album.title}
              </h2>

              {album.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {album.description}
                </p>
              )}

              {album.event_date && (
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={16} />
                  {formatDate(album.event_date)}
                </p>
              )}

              <p className="mt-4 text-sm font-medium text-gray-700">
                Open album →
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
