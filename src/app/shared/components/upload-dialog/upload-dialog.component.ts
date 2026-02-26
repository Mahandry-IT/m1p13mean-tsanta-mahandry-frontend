import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface UploadDialogLimits {
  maxFiles?: number;
  maxFileSizeBytes?: number;
}

export interface UploadDialogData {
  title?: string;
  accept?: string;
  multiple?: boolean;
  helperText?: string;
  dropLabel?: string;
  initialFiles?: File[];
  limits?: UploadDialogLimits;
}

export interface UploadDialogResult {
  files: File[];
}

@Component({
  selector: 'app-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class UploadDialogComponent {
  isDragOver = false;
  files: File[] = [];
  errorMessage = '';

  constructor(
    private readonly dialogRef: MatDialogRef<UploadDialogComponent, UploadDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: UploadDialogData
  ) {
    this.files = [...(data.initialFiles ?? [])];
  }

  onBrowse(files: FileList | null): void {
    if (!files || files.length === 0) return;
    this.addFiles(Array.from(files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const dt = event.dataTransfer;
    if (!dt?.files) return;
    this.addFiles(Array.from(dt.files));
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.files = [...this.files];
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.dialogRef.close({ files: this.files });
  }

  get canConfirm(): boolean {
    return this.files.length > 0;
  }

  private addFiles(incoming: File[]): void {
    this.errorMessage = '';

    const multiple = !!this.data.multiple;
    const acceptedIncoming = this.filterFilesByAccept(incoming, this.data.accept);

    if (acceptedIncoming.length === 0) {
      this.errorMessage = "Aucun fichier ne correspond aux types autorisés.";
      return;
    }

    const maxFileSizeBytes = this.data.limits?.maxFileSizeBytes;
    const tooLarge = maxFileSizeBytes
      ? acceptedIncoming.filter((f) => f.size > maxFileSizeBytes)
      : [];

    const sizeOk = maxFileSizeBytes
      ? acceptedIncoming.filter((f) => f.size <= maxFileSizeBytes)
      : acceptedIncoming;

    if (tooLarge.length) {
      this.errorMessage = `Certains fichiers dépassent la taille maximale (${this.formatBytes(maxFileSizeBytes!)}).`;
    }

    let next = multiple ? [...this.files, ...sizeOk] : [sizeOk[0]];

    const maxFiles = this.data.limits?.maxFiles;
    if (multiple && maxFiles && next.length > maxFiles) {
      next = next.slice(0, maxFiles);
      this.errorMessage = `Vous pouvez sélectionner jusqu'à ${maxFiles} fichier(s).`;
    }

    // dédoublonnage simple (name+size+lastModified)
    const seen = new Set<string>();
    next = next.filter((f) => {
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    this.files = next;
  }

  private filterFilesByAccept(files: File[], accept?: string): File[] {
    if (!accept) return files;

    const accepted = accept
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const matches = (file: File): boolean => {
      if (accepted.some((a) => a.endsWith('/*') && file.type?.startsWith(a.replace('/*', '/')))) {
        return true;
      }
      if (accepted.some((a) => a.startsWith('.') && file.name.toLowerCase().endsWith(a.toLowerCase()))) {
        return true;
      }
      if (accepted.some((a) => !a.startsWith('.') && !a.endsWith('/*') && file.type === a)) {
        return true;
      }
      return false;
    };

    return files.filter(matches);
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }
}

