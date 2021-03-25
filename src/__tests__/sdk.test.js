import { Client } from "@absmartly/javascript-client";
import SDK from "../sdk";
import Context from "../context";

jest.mock("@absmartly/javascript-client");
jest.mock("../context");

const testEventLogger = jest.fn();
const sdkOptions = {
	agent: "javascript-sdk",
	apiKey: "apikey",
	application: "website",
	endpoint: "localhost:8080",
	environment: "test",
	eventLogger: testEventLogger,
	timeout: 1000,
};

describe("SDK", () => {
	it("constructor should try to create a client with no options", (done) => {
		const sdk = new SDK();

		expect(sdk).toBeInstanceOf(SDK);
		expect(sdk.getEventLogger()).toBe(SDK.defaultEventLogger);
		expect(Client).toHaveBeenCalledTimes(1);
		expect(Client).toHaveBeenCalledWith({
			agent: "absmartly-javascript-sdk",
		});

		done();
	});

	it("constructor should create a client with specified options", (done) => {
		const sdk = new SDK(sdkOptions);

		expect(sdk).toBeInstanceOf(SDK);
		expect(sdk.getEventLogger()).toBe(testEventLogger);
		expect(Client).toHaveBeenCalledTimes(1);
		expect(Client).toHaveBeenCalledWith({
			agent: "javascript-sdk",
			apiKey: "apikey",
			application: "website",
			endpoint: "localhost:8080",
			environment: "test",
			timeout: 1000,
		});

		done();
	});

	it("constructor should set default values for unspecified client options", (done) => {
		const options = {
			application: "application",
			apiKey: "apikey",
			endpoint: "localhost:8080",
			environment: "test",
		};

		const sdk = new SDK(options);

		expect(sdk).toBeInstanceOf(SDK);
		expect(sdk.getEventLogger()).toBe(SDK.defaultEventLogger);
		expect(Client).toHaveBeenCalledTimes(1);
		expect(Client).toHaveBeenCalledWith(
			Object.assign(
				{},
				{
					agent: "absmartly-javascript-sdk",
				},
				options
			)
		);

		done();
	});

	it("setLogger() should override the current logger", (done) => {
		const sdk = new SDK(sdkOptions);
		expect(sdk.getEventLogger()).toBe(testEventLogger);

		const newLogger = jest.fn();
		sdk.setEventLogger(newLogger);
		expect(sdk.getEventLogger()).toBe(newLogger);

		done();
	});

	it("createContext() should create Context object with promise", (done) => {
		const sdk = new SDK(sdkOptions);

		const promise = Promise.resolve({});
		sdk.getClient().createContext.mockReturnValue(promise);

		const contextOptions = {
			publishDelay: 1000,
			refreshPeriod: 0,
			eventLogger: testEventLogger,
		};

		const request = {
			units: {
				session_id: "ab",
			},
		};

		const context = sdk.createContext(request, contextOptions);

		expect(context).toBeInstanceOf(Context);
		expect(sdk.getClient().createContext).toHaveBeenCalledTimes(1);
		expect(sdk.getClient().createContext).toHaveBeenCalledWith({
			units: [{ type: "session_id", uid: "ab" }],
		});

		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), contextOptions, promise);

		done();
	});

	it("createContext() should coerce unit uid to string", (done) => {
		const sdk = new SDK(sdkOptions);

		const promise = Promise.resolve({});
		sdk.getClient().createContext.mockReturnValue(promise);

		const contextOptions = {
			publishDelay: 1000,
			refreshPeriod: 0,
			eventLogger: testEventLogger,
		};

		const request = {
			units: {
				session_id: "ab",
				user_id: 125,
				float_id: 125.75,
			},
		};

		const context = sdk.createContext(request, contextOptions);

		expect(context).toBeInstanceOf(Context);
		expect(sdk.getClient().createContext).toHaveBeenCalledTimes(1);
		expect(sdk.getClient().createContext).toHaveBeenCalledWith({
			units: [
				{
					type: "session_id",
					uid: "ab",
				},
				{
					type: "user_id",
					uid: "125",
				},
				{
					type: "float_id",
					uid: "125",
				},
			],
		});

		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), contextOptions, promise);

		done();
	});

	it("createContext() should throw on unsupported unit uid type", (done) => {
		const sdk = new SDK(sdkOptions);

		const promise = Promise.resolve({});
		sdk.getClient().createContext.mockReturnValue(promise);

		const contextOptions = {
			publishDelay: 1000,
			refreshPeriod: 0,
			eventLogger: testEventLogger,
		};

		const request = {
			units: {
				session_id: true,
			},
		};

		expect(() => sdk.createContext(request, contextOptions)).toThrow(
			new Error("Unit 'session_id' UID is of unsupported type 'boolean'. UID must be one of ['string', 'number']")
		);
		expect(sdk.getClient().createContext).not.toHaveBeenCalled();
		expect(Context).not.toHaveBeenCalled();

		done();
	});

	it("createContextWith() should not call client createContext", (done) => {
		const data = {
			guid: "test",
		};

		const contextOptions = {
			publishDelay: 1000,
			refreshPeriod: 0,
			eventLogger: testEventLogger,
		};

		const sdk = new SDK(sdkOptions);
		const context = sdk.createContextWith(data, contextOptions);

		expect(context).toBeInstanceOf(Context);
		expect(sdk.getClient().createContext).not.toHaveBeenCalled();

		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), contextOptions, data);

		done();
	});

	it("createContext() should initialize context with default options for nodejs", (done) => {
		const sdk = new SDK(sdkOptions);

		const promise = Promise.resolve({});
		sdk.getClient().createContext.mockReturnValue(promise);

		const request = {
			units: {
				session_id: "ab",
			},
		};

		const context = sdk.createContext(request);

		const defaultOptions = {
			publishDelay: -1,
			refreshPeriod: 0,
			eventLogger: sdkOptions.eventLogger,
		};

		expect(context).toBeInstanceOf(Context);
		expect(sdk.getClient().createContext).toHaveBeenCalledTimes(1);
		expect(sdk.getClient().createContext).toHaveBeenCalledWith({
			units: [{ type: "session_id", uid: "ab" }],
		});

		expect(context).toBeInstanceOf(Context);
		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), defaultOptions, promise);

		done();
	});

	it("createContext() should initialize context with default options for browser", (done) => {
		const sdk = new SDK(sdkOptions);

		const promise = Promise.resolve({});
		sdk.getClient().createContext.mockReturnValue(promise);

		const request = {
			units: {
				session_id: "ab",
			},
		};

		// fake browser environment
		const previousWindow = global.window;
		global.window = { navigator: {} };

		const context = sdk.createContext(request);

		// restore environment
		global.window = previousWindow;

		const defaultOptions = {
			publishDelay: 100,
			refreshPeriod: 0,
			eventLogger: sdkOptions.eventLogger,
		};

		expect(context).toBeInstanceOf(Context);
		expect(sdk.getClient().createContext).toHaveBeenCalledTimes(1);
		expect(sdk.getClient().createContext).toHaveBeenCalledWith({
			units: [{ type: "session_id", uid: "ab" }],
		});

		expect(context).toBeInstanceOf(Context);
		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), defaultOptions, promise);

		done();
	});

	it("createContextWith() should initialize context with default options", (done) => {
		const data = {
			guid: "test",
		};

		const sdk = new SDK(sdkOptions);
		const context = sdk.createContextWith(data);

		const defaultOptions = {
			publishDelay: -1,
			refreshPeriod: 0,
			eventLogger: sdkOptions.eventLogger,
		};

		expect(context).toBeInstanceOf(Context);
		expect(Context).toHaveBeenCalledTimes(1);
		expect(Context).toHaveBeenCalledWith(sdk, sdk.getClient(), defaultOptions, data);

		done();
	});

	it("defaultLogger should log only errors to console", (done) => {
		const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		jest.spyOn(console, "warn").mockImplementation(() => {});
		jest.spyOn(console, "info").mockImplementation(() => {});
		jest.spyOn(console, "log").mockImplementation(() => {});

		for (const eventName of ["error", "ready", "refresh", "publish", "goal", "exposure"]) {
			if (eventName === "error") {
				SDK.defaultEventLogger("context", eventName, "error text");
				expect(console.error).toHaveBeenCalledTimes(1);
				expect(console.error).toHaveBeenCalledWith("error text");

				errorSpy.mockClear();
			} else {
				SDK.defaultEventLogger("context", eventName, {});
				expect(console.error).toHaveBeenCalledTimes(0);
			}
			expect(console.warn).toHaveBeenCalledTimes(0);
			expect(console.info).toHaveBeenCalledTimes(0);
			expect(console.log).toHaveBeenCalledTimes(0);
		}

		done();
	});
});
