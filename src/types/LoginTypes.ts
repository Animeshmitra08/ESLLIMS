export interface LoginResponse {
    userData: UserData;
    refreshToken: string | null;
    tokenExpiryDate: string;
    isRememberMeEnabled: boolean;
}

export interface UserData {
    UserId : string;
    ChangePassword : boolean;
    CompanyId : string;
    CompanyName : string;
    Configuration : string;
    RoleName : string;
    RoleId: string;
    token: string;
}