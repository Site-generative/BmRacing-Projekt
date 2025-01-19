import asyncio
import websockets
import json

async def test_websocket():
    event_id = 20  # Nahraďte ID svého eventu
    driver_id = 3  # Nahraďte ID svého řidiče

    url = f"wss://test.bmracing.cz/flags/{event_id}/{driver_id}"

    headers = {
        "X-API-KEY": "YUW@hcKGmYRVkN7pnIxT7wX4KWaDG5@zdvV5bGwn0hrVSvZZU=",
    }

    try:
        # Připojení k WebSocket serveru s hlavičkami
        async with websockets.connect(url, extra_headers=headers) as websocket:
            print(f"Připojeno k WebSocket: {url}")

            # Odeslání testovací zprávy
            test_message = {"action": "test", "message": "Hello, WebSocket!"}
            await websocket.send(json.dumps(test_message))
            print(f"Odeslaná zpráva: {test_message}")

            # Přijetí odpovědi
            response = await websocket.recv()
            print(f"Přijatá odpověď: {response}")

    except websockets.exceptions.ConnectionClosedError as e:
        print(f"Spojení bylo ukončeno: {e}")
    except Exception as e:
        print(f"Chyba při připojení nebo komunikaci: {e}")


if __name__ == "__main__":
    asyncio.run(test_websocket())
