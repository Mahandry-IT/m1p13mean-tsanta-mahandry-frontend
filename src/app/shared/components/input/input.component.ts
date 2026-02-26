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
import { PhoneNumberFormat } from 'ngx-intl-tel-input';

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

export type InputMode = 'input' | 'textarea' | 'select' | 'file' | 'tel';

export interface InputOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

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
  /** Mode d'affichage du composant */
  @Input() mode: InputMode = 'input';

  /** Type HTML du input (mode="input") */
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

  /** Select */
  @Input() options: InputOption[] = [];

  /** File */
  @Input() accept?: string;
  @Input() multiple = false;

  /** Tel (ngx-intl-tel-input)
   * codes pays ISO2 en minuscule: ex ['mg','fr']
   */
  @Input() preferredCountries: string[] = ['mg', 'fr'];
  @Input() separateDialCode = false;
  @Input() searchCountryFlag = true;
  @Input() enablePlaceholder = true;

  /** Format NATIONAL : "032 xx xxx xx" */
  readonly phoneNumberFormat = PhoneNumberFormat.National;

  /** Gestion d'erreur externe (ex: API) */
  @Input() error?: InputError;

  /** Émet la valeur brute (optionnel) */
  @Output() valueChange = new EventEmitter<any>();

  /** Émet les fichiers sélectionnés (mode="file") */
  @Output() fileChange = new EventEmitter<File | File[] | null>();

  /** Émet la valeur complète du téléphone (mode="tel") */
  @Output() telChange = new EventEmitter<any>();

  onInput(): void {
    this.valueChange.emit(this.control?.value);
    if (this.mode === 'tel') {
      this.telChange.emit(this.control?.value);
    }
  }

  onFileSelected(files: FileList | null): void {
    if (!files || files.length === 0) {
      this.fileChange.emit(null);
      return;
    }

    if (this.multiple) {
      this.fileChange.emit(Array.from(files));
    } else {
      this.fileChange.emit(files[0]);
    }
  }

  get fileNameLabel(): string {
    const v = this.control?.value as any;
    if (typeof v === 'string') return v;
    return '';
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
    return (this.placeholder || this.mode === 'select') ? 'always' : 'auto';
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
    return this.mode === 'input' && this.type === 'password';
  }

  get effectiveType(): InputType {
    if (!this.isPasswordField) return this.type;
    return this.hidePassword ? 'password' : 'text';
  }

  get passwordToggleIcon(): string {
    return this.hidePassword ? 'visibility' : 'visibility_off';
  }
}
