# ModelFold Python SDK

This package presets the OpenAI SDK to `https://modelfold.ai/v1` and reads
`MODELFOLD_API_KEY`. It does not use `OPENAI_API_KEY`.

```python
from modelfold import ModelFold

with ModelFold() as client:
    print([model.id for model in client.list_models()])
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello."}],
        max_tokens=20,
    )
    print(completion.choices[0].message.content)
```

From a source checkout, `python -m pip install ./python` installs it locally.
See [ModelFold pricing](https://modelfold.ai/pricing) before making billed calls.
