import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';

export type InputType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'datetime-local';

export interface InputError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class InputComponent implements OnChanges {
  /** Type HTML du input */
  @Input() type: InputType = 'text';

  /** FormControl à binder (Reactive Forms) */
  @Input({ required: true }) control!: FormControl<unknown>;

  /** Name/id du champ */
  @Input({ required: true }) name!: string;

  /** Placeholder */
  @Input() placeholder = '';

  /** Label au-dessus du champ */
  @Input() label = '';

  /** Hint (mat-hint) */
  @Input() hint = '';

  /** Désactivé */
  @Input() disabled = false;

  /** Required (affichage + attribut) */
  @Input() required = false;

  /** Props CSS: classes et styles inline */
  @Input() className = '';
  @Input() style: Record<string, any> | null = null;
  @Input() appearance: 'fill' | 'outline' = 'outline';

  /** Longueurs (texte) */
  @Input() minLength?: number;
  @Input() maxLength?: number;

  /** Valeurs (number/date) */
  @Input() min?: number | string;
  @Input() max?: number | string;
  @Input() step?: number;

  /** Limites spécifiques */
  @Input() pattern?: string;
  @Input() autocomplete?: string;

  /** Gestion d'erreur externe (ex: API) */
  @Input() error?: InputError;

  /** Émet la valeur brute (optionnel) */
  @Output() valueChange = new EventEmitter<any>();

  onInput(): void {
    this.valueChange.emit(this.control?.value);
  }

  get showExternalError(): boolean {
    return !!this.error && this.error.field === this.name;
  }

  get externalErrorMessage(): string {
    return this.showExternalError ? this.error!.message : '';
  }

  get showValidationError(): boolean {
    return this.control?.invalid && (this.control.dirty || this.control.touched);
  }

  /**
   * Permet d'éviter le recouvrement visuel label/placeholder quand le champ est vide.
   * Si un placeholder est fourni, on force le label à flotter dès le départ.
   */
  get floatLabel(): 'always' | 'auto' {
    return this.placeholder ? 'always' : 'auto';
  }

  /**
   * Password: état local d'affichage/masquage.
   * (On ne touche pas la valeur, uniquement le type du champ.)
   */
  hidePassword = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && this.control) {
      if (this.disabled) {
        this.control.disable();
      } else {
        this.control.enable();
      }
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  get isPasswordField(): boolean {
    return this.type === 'password';
  }

  get effectiveType(): InputType {
    if (!this.isPasswordField) return this.type;
    return this.hidePassword ? 'password' : 'text';
  }

  get passwordToggleIcon(): string {
    return this.hidePassword ? 'visibility' : 'visibility_off';
  }
}
