import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { PokemonService } from '../services/pokemon.service';
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { PokeStatsComponent } from '../poke-stats/poke-stats.component';
import { MatPaginator, MatSort } from '@angular/material';
import {Http} from '@angular/http';
import {BehaviorSubject} from "rxjs/BehaviorSubject";


@Component({
  selector: 'app-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
      state('expanded', style({height: '*', visibility: 'visible'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class PokemonComponent implements OnInit {

  dataSource: PokemonDataSource | null;
  displayedColumns = ['sprites', 'name', 'id', 'weight', 'height', 'type'];
  isExpansionDetailRow = (row) => row.hasOwnProperty('detailRow');

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private pokemonService: PokemonService, private http: Http) { }

  ngOnInit() {
    this.dataSource = new PokemonDataSource(this.pokemonService, this.paginator, this.sort);
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

}

export class PokemonDataSource extends DataSource<any>{

  resultsLength = 0;
  pageSize = 0;

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  constructor(private pokemonService: PokemonService,
              private paginator: MatPaginator,
              private sort: MatSort){
    super();

  }

  connect(): Observable<Pokemon[]>{

    const displayDataChanges = [
      this.sort.sortChange,
      this.paginator.page,
      this._filterChange,
    ];

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    return Observable.merge(...displayDataChanges)
      .startWith(null)
      .switchMap(() => {
        console.log(this.sort.direction);
        return this.pokemonService.getPokePage(this.sort.active, this.sort.direction, this.paginator.pageIndex, this._filterChange.getValue());
      })
      .map((pokemen) => {

        return pokemen['docs'].slice().filter((item: Pokemon) => {
          const rows = [];
          pokemen['docs'].forEach(element => rows.push(element, { detailRow: true, element }));
          this.pageSize = Number(pokemen['limit']);
          this.resultsLength = Number(pokemen['total']);
          let searchStr = (item.name).toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
        });
      });
  }

  disconnect() { }
}

// Interface for pokemon API
export interface Pokemon {
  _id: string;
  stats: object;
  name: string;
  weight: number;
  order: number;
  height: number;
  is_default: boolean;
  id: number;
  in_games: string[];
  moves: string[];
  type: string[];
  sprites: object;
}
