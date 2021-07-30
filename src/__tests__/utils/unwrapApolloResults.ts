import unwrapApolloResult from "@/utils/unwrapApolloResult";
import { ApolloError } from "@apollo/client/errors";
import { GraphQLError } from "graphql";

describe('Unwrap Apollo results', () => {
  test('Unwrap Apollo results - Result', () => {
    const data = {
      expressionCreate: "QmfMfVxRpEzzXxLmraTQumQjfU1mT1NggkT1j9fWSnnC1s://8429246fa9e42d1d1e8cfe62291a79bfc3dd5667acf2b273207bf614b13615abcccb7d3406dd88"
    };

    const result = unwrapApolloResult({
      data
    });

    expect(result).toStrictEqual(data);
  });

  test('Unwrap Apollo results - Error', () => {
    const error: ApolloError = new ApolloError({
      errorMessage: 'Test Error',
    });

    try {
      //@ts-ignore
      unwrapApolloResult({
        error
      });
    } catch (error) {
      expect(error).toBe("Test Error");
    }
  });

  test('Unwrap Apollo results - Errors', () => {
    const errors: ReadonlyArray<GraphQLError> = [new GraphQLError('Test Error')];

    try {
      //@ts-ignore
      unwrapApolloResult({
        errors
      });
    } catch (error) {
      expect(error.map((e: any) => e.message)).toStrictEqual(["Test Error"]);
    }
  });
});