import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  mode: 'login'|'register' = 'login';
  error = '';
  loading = false;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get usernameCtrl() { return this.form.get('username'); }
  get passwordCtrl() { return this.form.get('password'); }

  switchMode(m: 'login'|'register') {
    this.mode = m;
    this.error = '';
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const v = this.form.value;
    const username = (v.username ?? '').trim();
    const password = (v.password ?? '').trim();

    const obs = this.mode === 'login'
      ? this.auth.login({ username, password })
      : this.auth.register({ username, email: (v.email ?? '').trim(), password });

    obs.subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error ?? err?.message ?? 'Failed';
      }
    });
  }
}