import { Injectable } from '@angular/core';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class PictureService {

  constructor(private httpService: HttpService) { }

  async getPicturePathsAt(path: string): Promise<string[]> {
    return [""];
  }

  async getRandomPicturePathAt(path: string): Promise<string> {
    return this.httpService.getText(`getRandomImage?path=${encodeURIComponent(path)}`)
  }

  async getImageUrl(imagePath: string): Promise<string> {
    return this.httpService.getApi()+`imageByPath?path=${encodeURIComponent(imagePath)}`;
  }

  async getImageDetails(imagePath: string): Promise<ImageDetails> {
    return this.httpService.get(`getSingleImageData?path=${imagePath}`);
  }
}

export interface ImageDetails {
  dir: string,
  height: number,
  width: number,
  mtime: Date,
  name: string
}
