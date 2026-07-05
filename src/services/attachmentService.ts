import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { generateId } from '../utils/id';
import type { Attachment } from '../types';

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;

/**
 * Files are copied into the app's document directory so attachments survive
 * app restarts and stay available when the original gallery item is removed.
 */
async function persistFile(sourceUri: string, name: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  const target = `${ATTACHMENTS_DIR}${generateId()}-${name.replace(/[^\w.\-]/g, '_')}`;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}

export async function pickImage(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is required to attach images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const uri = await persistFile(asset.uri, name);

  return {
    id: generateId(),
    uri,
    name,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? undefined,
    addedAt: new Date().toISOString(),
  };
}

export async function pickDocument(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const uri = await persistFile(asset.uri, asset.name);

  return {
    id: generateId(),
    uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? undefined,
    addedAt: new Date().toISOString(),
  };
}

export async function attachmentExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

export async function deleteAttachmentFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    // Losing an orphan file is acceptable; never block the UI flow on cleanup
    console.warn('[attachments] delete failed', error);
  }
}
