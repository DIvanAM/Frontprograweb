import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Departamento, Puesto } from '../../../core/models/rrhh.models';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Gestión de Catálogos (Departamentos & Puestos)</h1>
            <p class="page-subtitle">
              Administración de estructura organizacional, áreas y puestos de trabajo.
            </p>
          </div>
        </div>
      </div>

      <div class="catalogos-grid">
        <!-- Panel 1: Departamentos -->
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">
              Departamentos
              <span class="badge badge-dark">{{ departamentos().length }}</span>
            </h2>
          </div>

          <div class="card-body">
            <form [formGroup]="deptoForm" (ngSubmit)="saveDepto()" class="inline-form" novalidate>
              <div class="form-group">
                <label class="form-label">Nombre del Departamento <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  formControlName="nombre"
                  placeholder="Ej. Marketing Digital"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <input
                  type="text"
                  class="form-control"
                  formControlName="descripcion"
                  placeholder="Breve descripción del área"
                />
              </div>
              <div class="form-btns">
                @if (editingDeptoId()) {
                  <button type="button" class="btn btn-sm btn-outline" (click)="cancelDeptoEdit()">
                    Cancelar
                  </button>
                }
                <button type="submit" class="btn btn-sm btn-primary" [disabled]="deptoForm.invalid">
                  {{ editingDeptoId() ? 'Actualizar Departamento' : '+ Agregar Departamento' }}
                </button>
              </div>
            </form>

            <div class="catalog-list">
              @for (d of departamentos(); track d.id) {
                <div class="catalog-item">
                  <div>
                    <strong>{{ d.nombre }}</strong>
                    <p>{{ d.descripcion || 'Sin descripción' }}</p>
                  </div>
                  <div class="item-actions">
                    <button type="button" class="btn btn-sm btn-outline" (click)="editDepto(d)">
                      Editar
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      (click)="deleteDepto(d.id)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Panel 2: Puestos de Trabajo -->
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">
              Puestos de Trabajo
              <span class="badge badge-dark">{{ puestos().length }}</span>
            </h2>
          </div>

          <div class="card-body">
            <form [formGroup]="puestoForm" (ngSubmit)="savePuesto()" class="inline-form" novalidate>
              <div class="form-group">
                <label class="form-label">Nombre del Puesto <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  formControlName="nombre"
                  placeholder="Ej. Diseñador UI/UX"
                />
              </div>
              <div class="two-cols">
                <div class="form-group">
                  <label class="form-label">Departamento <span class="required">*</span></label>
                  <select class="form-control" formControlName="departamentoId">
                    @for (d of departamentos(); track d.id) {
                      <option [value]="d.id">{{ d.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Nivel</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="nivel"
                    placeholder="Ej. Senior / Mid / Junior"
                  />
                </div>
              </div>
              <div class="form-btns">
                @if (editingPuestoId()) {
                  <button type="button" class="btn btn-sm btn-outline" (click)="cancelPuestoEdit()">
                    Cancelar
                  </button>
                }
                <button type="submit" class="btn btn-sm btn-primary" [disabled]="puestoForm.invalid">
                  {{ editingPuestoId() ? 'Actualizar Puesto' : '+ Agregar Puesto' }}
                </button>
              </div>
            </form>

            <div class="catalog-list">
              @for (p of puestos(); track p.id) {
                <div class="catalog-item">
                  <div>
                    <strong>{{ p.nombre }}</strong>
                    <p>{{ p.departamentoNombre }} · Nivel: {{ p.nivel || 'General' }}</p>
                  </div>
                  <div class="item-actions">
                    <button type="button" class="btn btn-sm btn-outline" (click)="editPuesto(p)">
                      Editar
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      (click)="deletePuesto(p.id)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
  styles: `
    .catalogos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .inline-form {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 14px;
      margin-bottom: 16px;
    }

    .two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .form-btns {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .catalog-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .catalog-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      strong {
        display: block;
        font-size: 0.9rem;
        color: var(--color-text);
      }

      p {
        margin: 2px 0 0;
        font-size: 0.78rem;
        color: var(--color-text-muted);
      }
    }

    .item-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    @media (max-width: 900px) {
      .catalogos-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CatalogosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly departamentos = this.rrhh.departamentos;
  readonly puestos = this.rrhh.puestos;

  readonly editingDeptoId = signal<number | null>(null);
  readonly editingPuestoId = signal<number | null>(null);

  readonly deptoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  readonly puestoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    departamentoId: [1, Validators.required],
    nivel: ['Especialista'],
  });

  saveDepto(): void {
    if (this.deptoForm.invalid) return;
    const { nombre, descripcion } = this.deptoForm.getRawValue();
    const id = this.editingDeptoId();
    const res = id
      ? this.rrhh.editarDepartamento(id, nombre, descripcion)
      : this.rrhh.crearDepartamento(nombre, descripcion);

    if (res.ok) {
      this.toast.success('Catálogo actualizado', res.message);
      this.cancelDeptoEdit();
    } else {
      this.toast.error('Error en Departamento', res.message);
    }
  }

  editDepto(d: Departamento): void {
    this.editingDeptoId.set(d.id);
    this.deptoForm.setValue({ nombre: d.nombre, descripcion: d.descripcion });
  }

  cancelDeptoEdit(): void {
    this.editingDeptoId.set(null);
    this.deptoForm.reset({ nombre: '', descripcion: '' });
  }

  deleteDepto(id: number): void {
    const res = this.rrhh.eliminarDepartamento(id);
    if (res.ok) {
      this.toast.success('Eliminado', res.message);
    } else {
      this.toast.error('Operación bloqueada', res.message);
    }
  }

  savePuesto(): void {
    if (this.puestoForm.invalid) return;
    const { nombre, departamentoId, nivel } = this.puestoForm.getRawValue();
    const id = this.editingPuestoId();
    const res = id
      ? this.rrhh.editarPuesto(id, nombre, Number(departamentoId), nivel)
      : this.rrhh.crearPuesto(nombre, Number(departamentoId), nivel);

    if (res.ok) {
      this.toast.success('Catálogo actualizado', res.message);
      this.cancelPuestoEdit();
    } else {
      this.toast.error('Error en Puesto', res.message);
    }
  }

  editPuesto(p: Puesto): void {
    this.editingPuestoId.set(p.id);
    this.puestoForm.setValue({
      nombre: p.nombre,
      departamentoId: p.departamentoId,
      nivel: p.nivel ?? '',
    });
  }

  cancelPuestoEdit(): void {
    this.editingPuestoId.set(null);
    this.puestoForm.reset({ nombre: '', departamentoId: 1, nivel: 'Especialista' });
  }

  deletePuesto(id: number): void {
    const res = this.rrhh.eliminarPuesto(id);
    if (res.ok) {
      this.toast.success('Eliminado', res.message);
    } else {
      this.toast.error('Operación bloqueada', res.message);
    }
  }
}
