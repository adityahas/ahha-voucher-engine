export interface BaseResponseInterface {
  readonly code: string;
  readonly message: string;
  readonly data?: any;
}

export interface BasePaginationResponseInterface<
  T,
> extends BaseResponseInterface {
  readonly pagination: {
    readonly page: number;
    readonly total: number;
    readonly size: number;
  };
  readonly data: T[];
}

export interface BaseErrorResponseInterface extends BaseResponseInterface {
  readonly errors: {
    readonly field: string;
    readonly message: string;
  }[];
}
