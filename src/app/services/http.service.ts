import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  ipaddr: string = "";

  constructor(private http: HttpClient) {
  }

  async get(url: string): Promise<any> {
    let urlString = url;
    const response = await firstValueFrom(this.http.get(this.getApi()+urlString));
    return response;
  }

  async getText(url: string): Promise<any> {
    let urlString = url;
    const response = await firstValueFrom(this.http.get(this.getApi()+urlString, {
      responseType: 'text'
    }));
    return response;
  }

  async post(url: string, body: any): Promise<any> {
    let urlString = url;
    const response = await firstValueFrom(this.http.post(this.getApi()+urlString, body));
    return response;
  }

  getApi() {
    let api = "http://localhost:29880/api/";
    return api;
  }
}
