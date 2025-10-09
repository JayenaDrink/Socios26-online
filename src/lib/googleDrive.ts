import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google Drive API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GoogleDriveService {
  private drive: any;
  private auth: OAuth2Client;

  constructor() {
    this.auth = new OAuth2Client(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET
    );

    // Set credentials if refresh token is available
    if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      this.auth.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // Search for files by name
  async searchFiles(fileName: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `name='${fileName}' and trashed=false`,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime)'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  // Get file content as buffer
  async getFileContent(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error getting file content:', error);
      throw new Error('Failed to get file content from Google Drive');
    }
  }

  // Update file content
  async updateFileContent(fileId: string, content: Buffer, mimeType: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'): Promise<void> {
    try {
      await this.drive.files.update({
        fileId: fileId,
        media: {
          mimeType: mimeType,
          body: content
        }
      });
    } catch (error) {
      console.error('Error updating file content:', error);
      throw new Error('Failed to update file in Google Drive');
    }
  }

  // Create new file
  async createFile(fileName: string, content: Buffer, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata: any = {
        name: fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          body: content
        }
      });

      return response.data.id!;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file in Google Drive');
    }
  }

  // Get folder contents
  async getFolderContents(folderName: string): Promise<any[]> {
    try {
      // First, find the folder
      const folders = await this.searchFiles(folderName);
      const folder = folders.find(f => f.mimeType === 'application/vnd.google-apps.folder');

      if (!folder) {
        throw new Error(`Folder '${folderName}' not found`);
      }

      // Get contents of the folder
      const response = await this.drive.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime)'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error getting folder contents:', error);
      throw new Error(`Failed to get contents of folder '${folderName}'`);
    }
  }

  // Find specific Excel files
  async findExcelFiles(): Promise<{
    list2025?: { id: string; name: string };
    list2026?: { id: string; name: string };
  }> {
    try {
      const files = await this.getFolderContents('2026');
      
      const list2025 = files.find(f => 
        f.name.includes('2025') && 
        (f.name.includes('.xlsx') || f.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      );

      const list2026 = files.find(f => 
        f.name.includes('2026') && 
        (f.name.includes('.xlsx') || f.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      );

      return {
        list2025: list2025 ? { id: list2025.id, name: list2025.name } : undefined,
        list2026: list2026 ? { id: list2026.id, name: list2026.name } : undefined
      };
    } catch (error) {
      console.error('Error finding Excel files:', error);
      throw new Error('Failed to find Excel files in Google Drive');
    }
  }
}

// Singleton instance
let googleDriveService: GoogleDriveService | null = null;

export function getGoogleDriveService(): GoogleDriveService {
  if (!googleDriveService) {
    googleDriveService = new GoogleDriveService();
  }
  return googleDriveService;
}
