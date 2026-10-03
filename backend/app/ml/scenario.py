import json
from typing import Dict, Any, List

class ScenarioManager:
    def __init__(self):
        self.scenarios = {}

    def save_scenario(self, name: str, params: Dict[str, Any], results: Any) -> None:
        self.scenarios[name] = {
            "params": params,
            "results": results
        }

    def get_scenario(self, name: str) -> Dict[str, Any]:
        return self.scenarios.get(name, {})

    def list_scenarios(self) -> List[str]:
        return list(self.scenarios.keys())

    def compare_scenarios(self, names: List[str]) -> Dict[str, Any]:
        comparison = {}
        for name in names:
            if name in self.scenarios:
                comparison[name] = self.scenarios[name]
        return comparison

    def delete_scenario(self, name: str) -> bool:
        if name in self.scenarios:
            del self.scenarios[name]
            return True
        return False
        
    def export_scenarios(self) -> str:
        return json.dumps(self.scenarios)
        
    def import_scenarios(self, data_str: str) -> None:
        data = json.loads(data_str)
        if isinstance(data, dict):
            self.scenarios.update(data)
