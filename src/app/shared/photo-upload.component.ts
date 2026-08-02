import { Component, inject, input, output } from '@angular/core';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-photo-upload',
  template: `
    <div class="flex items-center gap-3">
      @if (url()) {
        <img [src]="url()" class="h-20 w-20 rounded object-cover" alt="foto" />
      }
      <input type="file" accept="image/*" (change)="onFile($event)" class="input" />
      @if (url()) {
        <button type="button" class="btn btn-danger" (click)="clear()">Quitar</button>
      }
    </div>
  `,
})
export class PhotoUploadComponent {
  private readonly api = inject(ApiService);
  readonly url = input<string | null>(null);
  readonly kind = input.required<string>();
  readonly urlChange = output<string | null>();

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api
      .upload('/uploads', file, this.kind())
      .subscribe((res) => this.urlChange.emit(res.url));
  }

  clear(): void {
    this.urlChange.emit(null);
  }
}
