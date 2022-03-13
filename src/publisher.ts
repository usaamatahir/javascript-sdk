import { Context, SDK } from ".";

export class ContextPublisher {
	publish(request: unknown, sdk: SDK, context: Context, requestOptions?: unknown): Promise<Record<string, unknown>> {
		return sdk.getClient().publish(request, requestOptions);
	}
}
