import { Controller, Get } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { Public } from "../auth/guards/public.decorator";

@Controller("api/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get("municipalities")
  getMunicipalities() {
    return this.locationsService.getMunicipalitiesAndNeighborhoods();
  }
}
