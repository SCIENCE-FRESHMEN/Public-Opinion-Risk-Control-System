from scripts import run_data_pipeline


def test_resolve_pipeline_end_date_uses_today_when_config_is_stale(monkeypatch) -> None:
    class FakeDate:
        @classmethod
        def today(cls):
            class _D:
                def isoformat(self):
                    return '2026-04-24'
            return _D()

    monkeypatch.setattr(run_data_pipeline, 'date', FakeDate)

    assert run_data_pipeline.resolve_pipeline_end_date({'end_date': '2026-04-22'}) == '2026-04-24'


def test_resolve_pipeline_end_date_keeps_future_or_current_config_value(monkeypatch) -> None:
    class FakeDate:
        @classmethod
        def today(cls):
            class _D:
                def isoformat(self):
                    return '2026-04-24'
            return _D()

    monkeypatch.setattr(run_data_pipeline, 'date', FakeDate)

    assert run_data_pipeline.resolve_pipeline_end_date({'end_date': '2026-04-25'}) == '2026-04-25'
