import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  apiURL: any;

  constructor(
    private http: HttpClient
  ) { }

  login(documento: string, password: string){
    return this.http.post(`${this.apiURL}/auth/login`, {documento, password});

  }
}
