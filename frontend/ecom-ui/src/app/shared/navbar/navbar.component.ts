import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf, AsyncPipe, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(public auth: AuthService, public cart: CartService) {}
  logout() { this.auth.logout(); }
}
