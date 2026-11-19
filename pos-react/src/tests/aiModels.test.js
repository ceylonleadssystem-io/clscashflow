import { describe, expect, it } from "vitest";
import aiModels from "../../../netlify/lib/ai-models.js";

const { listModels } = aiModels;
const reply = (status, body) => async () => ({ status, ok: status < 400, json: async () => body });
const spy = (status, body) => {
	const calls = [];
	return { calls, fetch: async (url, init) => (calls.push({ url, headers: init.headers }), reply(status, body)()) };
};

describe("models an AI account can use", () => {
	it("lists Claude models with their names, asking with the account's own key", async () => {
		const s = spy(200, { data: [{ id: "claude-opus-5-5", display_name: "Claude Opus 5.5" }, { id: "claude-haiku-5-5", display_name: "Claude Haiku 5.5" }] });
		expect(await listModels("anthropic", "sk-ant-key", s.fetch)).toEqual([{ id: "claude-opus-5-5", label: "Claude Opus 5.5" }, { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" }]);
		expect(s.calls[0].url).toMatch(/api\.anthropic\.com\/v1\/models/);
		expect(s.calls[0].headers["x-api-key"]).toBe("sk-ant-key");
	});

	it("keeps only chat models from OpenAI, newest first", async () => {
		const data = [{ id: "text-embedding-3-small", created: 5 }, { id: "gpt-5", created: 10 }, { id: "whisper-1", created: 1 }, { id: "gpt-4o", created: 7 }, { id: "gpt-4o-realtime-preview", created: 9 }, { id: "o3", created: 8 }, { id: "dall-e-3", created: 2 }];
		expect((await listModels("openai", "sk-key", reply(200, { data }))).map((m) => m.id)).toEqual(["gpt-5", "o3", "gpt-4o"]);
	});

	it("keeps only Gemini models that can answer messages, without the models/ prefix", async () => {
		const models = [{ name: "models/gemini-2.5-pro", displayName: "Gemini 2.5 Pro", supportedGenerationMethods: ["generateContent"] }, { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] }];
		expect(await listModels("gemini", "k", reply(200, { models }))).toEqual([{ id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }]);
	});

	it("says why it could not list: a refused key, a busy account, or an unknown provider", async () => {
		await expect(listModels("openai", "bad", reply(401, {}))).rejects.toMatchObject({ statusCode: 400, message: "ChatGPT did not accept this API key." });
		await expect(listModels("gemini", "k", reply(429, {}))).rejects.toMatchObject({ statusCode: 429 });
		await expect(listModels("nope", "k", reply(200, {}))).rejects.toMatchObject({ statusCode: 400 });
		await expect(listModels("anthropic", "k", async () => { throw new Error("down"); })).rejects.toMatchObject({ statusCode: 502 });
	});
});
