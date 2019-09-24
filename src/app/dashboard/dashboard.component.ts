import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NavbarComponent} from '../shared/navbar/navbar.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  public loading: boolean = false;
  public trelloKey: string;
  public trelloToken: string;
  public gloKey: string;
  public board: any;

  public boardDisabled: boolean = true;
  public submitDisabled: boolean = true;


  constructor(
    private http: HttpClient,
    private navbar: NavbarComponent,
    private router: Router
  ) {
  }

  public checkDisable() {
    if (this.trelloKey && this.trelloToken) {
      this.boardDisabled = false;
    } else {
      this.boardDisabled = true;
      this.board = null;
    }

    if (this.board && this.gloKey) {
      this.submitDisabled = false
    } else {
      this.submitDisabled = true;
    }
  }
}
