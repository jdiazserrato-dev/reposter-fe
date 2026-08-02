import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { PhotoUploadComponent } from '../../shared/photo-upload.component';
import { ProductFormComponent } from './product-form.component';
import { ProductsService } from './products.service';

describe('ProductFormComponent', () => {
  let service: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let param: string | null = null;
  const route = { snapshot: { paramMap: { get: () => param } } };
  const router = { navigate: vi.fn() };
  const api = { upload: vi.fn() };

  beforeEach(() => {
    service = { findOne: vi.fn(), create: vi.fn(), update: vi.fn() };
    param = null;
    TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        { provide: ProductsService, useValue: service },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ApiService, useValue: api },
      ],
    });
  });

  it('creates a product when the form is valid', () => {
    service.create.mockReturnValue(of({ id: 1 }));
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.componentInstance.form.setValue({
      name: 'Torta',
      category: 'torta',
      basePrice: 20,
      photoPath: null,
    });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    expect(service.create).toHaveBeenCalledWith({
      name: 'Torta',
      category: 'torta',
      basePrice: 20,
      photoPath: null,
    });
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.componentInstance.form.setValue({
      name: '',
      category: '',
      basePrice: -1,
      photoPath: null,
    });
    fixture.componentInstance.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('loads the product when editing', () => {
    service.findOne.mockReturnValue(
      of({
        id: 5,
        name: 'Torta',
        category: 'torta',
        basePrice: 25,
        photoPath: '/uploads/a.png',
      }),
    );
    param = '5';
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.get('name')!.value).toBe('Torta');
    expect(fixture.componentInstance.form.get('photoPath')!.value).toBe(
      '/uploads/a.png',
    );
  });

  it('updates the photoPath control when a photo is selected', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    const upload = fixture.debugElement.query(
      By.directive(PhotoUploadComponent),
    );
    upload.componentInstance.urlChange.emit('/uploads/b.png');
    expect(fixture.componentInstance.form.get('photoPath')!.value).toBe(
      '/uploads/b.png',
    );
  });
});
