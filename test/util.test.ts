import { assertConditionTruthy } from '../src/util';

describe('/test/util.test.ts', function () {
  it('should test assertConditionTruthy', function () {
    expect(assertConditionTruthy(undefined)).toBeTruthy();
    expect(assertConditionTruthy(false)).toBeTruthy();
    expect(assertConditionTruthy(true)).toBeFalsy();
    expect(assertConditionTruthy(undefined, false)).toBeTruthy();
    expect(assertConditionTruthy(undefined, false, true)).toBeFalsy();
  });
});
