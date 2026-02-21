import { environment } from "../environments/environment";

export class AppEndpoint {
    static readonly BASE_URL = environment.apiBaseUrl;

    /*Login */
    public static URL_API_LOGIN: string = AppEndpoint.BASE_URL + '/public/login';
    public static URL_API_REFRESH_TOKEN: string = AppEndpoint.BASE_URL + '/public/refresh';
    /*rol menu*/
    public static URL_API_ROL_MENU: string = AppEndpoint.BASE_URL+'/private/rol-menu';
    public static URL_API_ROL_MENUS: string = AppEndpoint.BASE_URL+'/private/role-menus/role';

    /*Roles*/
    public static URL_API_ROLES: string = AppEndpoint.BASE_URL+'/private/roles';

    /* Users */
    public static URL_API_ALL_USERS: string = AppEndpoint.BASE_URL+'/private/users';

}
