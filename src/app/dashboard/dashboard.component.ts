import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NavbarComponent} from '../shared/navbar/navbar.component';
import {Router} from '@angular/router';
import {ColumnBody, GloSDK} from '@kyjus25/glo-rxjs-sdk';
import {error} from 'util';

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
  public boards: any;

  public boardDisabled: boolean = true;
  public submitDisabled: boolean = true;

  constructor(
    private http: HttpClient,
    private navbar: NavbarComponent,
    private router: Router,
    private glo: GloSDK
  ) {
    this.checkDisable();
  }

  public checkDisable() {
    if (this.trelloKey && this.trelloToken) {
      this.boardDisabled = false;
      this.getTrelloBoards();
    } else {
      this.boardDisabled = true;
      this.board = null;
    }

    this.submitDisabled = !(this.board && this.gloKey);
  }

  public getTrelloBoards() {
    if (!this.boards) {
      this.http.get(`https://api.trello.com/1/members/me/boards?fields=name,url&key=${this.trelloKey}&token=${this.trelloToken}`).subscribe(boards => {
        console.log('Trello Boards', boards);
        this.boards = boards;
        this.board = boards[0];
        this.checkDisable();
      }, error => { /* Silence is golden. */ });
    }
  }

  public submit() {
    this.loading = true;

    this.http.get(`https://api.trello.com/1/boards/${this.board.id}/lists?cards=all&card_fields=all&key=${this.trelloKey}&token=${this.trelloToken}`).subscribe(trelloColumns => {
      console.log(trelloColumns);
      const trelloColumnsArray = <any[]>trelloColumns;

      this.glo.setAccessToken(this.gloKey);
      this.glo.boards.create({name: this.board.name + ' (Trello)'}).subscribe(gloBoard => {
        console.log(gloBoard);
        this.glo.columns.batchCreate(gloBoard.id, trelloColumnsArray.map(column => <ColumnBody>{name: column.name})).subscribe(createdColumns => {
          if (trelloColumnsArray.length === createdColumns['successful'].length) {
            for (let i = 0; i < createdColumns['successful'].length; i++) {
              if (trelloColumnsArray[i].cards.length > 0) {
                const cardPayload = [];
                trelloColumnsArray[i].cards.forEach(cardIterate => {
                  const card = {
                    "name": cardIterate.name,
                    "description": {
                      "text": cardIterate.desc
                    },
                    "column_id": createdColumns['successful'][i].id,
                    "labels": [],
                  };
                  cardPayload.push(card);
                });
                this.loopCardCreate(cardPayload, gloBoard.id);
              }
            }
          } else {this.triggerError()}
        }, error => this.triggerError(error));
      }, error => this.triggerError(error));
    }, error => this.triggerError(error));
  }

  private loopCardCreate(cards, boardId) {
    this.glo.cards.batchCreate(boardId, cards.splice(0, 99)).subscribe(createdCards => {
      if (cards.length > 0) {
        this.loopCardCreate(cards, boardId);
      }
      this.loading = false;
    }, error => this.triggerError(error));
  }

  private triggerError(error?) {
    this.loading = false;
    if (error && error['error']['message']) {
      console.error('Error from Glo API: ' + error['error']['message']);
    }
    if (error && error['error']['nextValidRequestDate']) {
      console.error('Next Valid Request Date: ' + new Date(error['error']['nextValidRequestDate']).toString());
    }
  }
}
