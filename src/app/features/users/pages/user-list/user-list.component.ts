import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { ApiError } from '../../../../core/models/api-error.model';

interface UserDto {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false,
})
export class UserListComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  error?: ApiError;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = undefined;

    // Exemple d'appel API (à adapter à votre backend)
    this.api.get<UserDto[]>('/users').subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err: ApiError) => {
        // err vient de l'ErrorInterceptor
        this.error = err;
        this.loading = false;
      },
    });
  }
}
