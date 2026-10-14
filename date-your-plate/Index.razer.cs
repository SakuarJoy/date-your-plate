using System;

public class Class1
{
	public Class1()
	{
        @code {
    public class Ingredient
    {
        public string Name { get; set; }
        public int Quantity { get; set; }
        public DateTime ExpirationDate { get; set; }
        public bool IsInStock { get; set; } = true;
    }

    public List<Ingredient> MyStock { get; set; } = new();

    protected override async Task OnInitializedAsync()
    {
        // Laad mockdata in (In een echte app haal je dit eerst uit LocalStorage)
        MyStock = new List<Ingredient>
        {
            new Ingredient { Name = "Kipfilet", Quantity = 2, ExpirationDate = DateTime.Today.AddDays(1) },
            new Ingredient { Name = "Rode Paprika", Quantity = 1, ExpirationDate = DateTime.Today.AddDays(5) },
            new Ingredient { Name = "Kookroom", Quantity = 1, ExpirationDate = DateTime.Today.AddDays(1) }
        };
    }

    private async Task RemoveIngredient( Ingredient ingredient )
    {
        ingredient.IsInStock = false;

        // Sla de bijgewerkte status lokaal op in de browser van de gebruiker
        string json = System.Text.Json.JsonSerializer.Serialize(MyStock);
        await JSRuntime.InvokeVoidAsync("localStorage.setItem", "dateYourPlate_stock", json);
    }

    private void GenerateAiRecipe()
    {
        // Logica om de AI prompt te genereren (exact hetzelfde als in het app-voorbeeld!)
    }
}

	}
}
