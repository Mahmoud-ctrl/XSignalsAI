import pandas as pd

class DataSerializer:
    """Handles data serialization for analysis results"""
    
    @staticmethod
    def serialize_analysis_data(data):
        """Recursively serialize analysis data to JSON-compatible format"""
        if isinstance(data, dict):
            return {key: DataSerializer.serialize_analysis_data(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [DataSerializer.serialize_analysis_data(item) for item in data]
        elif isinstance(data, pd.DataFrame):
            return None  # Don't serialize DataFrames
        elif isinstance(data, (pd.Series, pd.Index)):
            return data.tolist()
        elif pd.isna(data):
            return None
        elif hasattr(data, 'item'):  # numpy types
            try:
                return data.item()
            except:
                return str(data)
        elif isinstance(data, (int, float, str, bool, type(None))):
            return data
        else:
            return str(data)
