import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { PhotoUploadComponent } from './photo-upload.component';

describe('PhotoUploadComponent', () => {
  const api = { upload: vi.fn() };

  beforeEach(() => {
    api.upload.mockReset();
    TestBed.configureTestingModule({
      imports: [PhotoUploadComponent],
      providers: [{ provide: ApiService, useValue: api }],
    });
  });

  it('uploads a file and emits the url', () => {
    const fixture = TestBed.createComponent(PhotoUploadComponent);
    fixture.componentRef.setInput('url', null);
    fixture.componentRef.setInput('kind', 'recipes');
    const emit = vi.fn();
    fixture.componentInstance.urlChange.subscribe(emit);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    api.upload.mockReturnValue(of({ url: '/uploads/recipes/a.png' }));
    const input = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(api.upload).toHaveBeenCalledWith('/uploads', file, 'recipes');
    expect(emit).toHaveBeenCalledWith('/uploads/recipes/a.png');
  });

  it('clears the url', () => {
    const fixture = TestBed.createComponent(PhotoUploadComponent);
    fixture.componentRef.setInput('url', '/uploads/a.png');
    fixture.componentRef.setInput('kind', 'products');
    const emit = vi.fn();
    fixture.componentInstance.urlChange.subscribe(emit);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(emit).toHaveBeenCalledWith(null);
  });

  it('ignores a change without a file', () => {
    const fixture = TestBed.createComponent(PhotoUploadComponent);
    fixture.componentRef.setInput('kind', 'recipes');
    const input = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [] });
    input.dispatchEvent(new Event('change'));
    expect(api.upload).not.toHaveBeenCalled();
  });
});
