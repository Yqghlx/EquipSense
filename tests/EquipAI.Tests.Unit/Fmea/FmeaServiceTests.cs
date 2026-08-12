using EquipAI.Application.Fmea;
using EquipAI.Application.Fmea.DTOs;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace EquipAI.Tests.Unit.Fmea;

public class FmeaServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly FmeaService _fmeaService;
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly Guid _testTenantId = Guid.NewGuid();

    public FmeaServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"FmeaTestDb_{Guid.NewGuid()}")
            .Options;

        _tenantContextMock = new Mock<ITenantContext>();
        _tenantContextMock.Setup(x => x.TenantId).Returns(_testTenantId);

        _dbContext = new AppDbContext(options, _tenantContextMock.Object);
        _fmeaService = new FmeaService(_dbContext, _tenantContextMock.Object);
        _dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task CreateAsync_Should_Create_FMEA_Entry_And_Calculate_RPN()
    {
        var request = new CreateFmeaEntryRequest
        {
            DeviceType = "Centrifugal Pump",
            FailureMode = "Bearing Wear",
            Cause = "Insufficient Lubrication",
            Effect = "Increased vibration, may cause shutdown",
            Detection = "Vibration > 7mm/s for 10 minutes",
            RecommendedAction = "Check oil level, add lubricant",
            Severity = 7,
            Occurrence = 5,
            Detectability = 3
        };

        var result = await _fmeaService.CreateAsync(request);

        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.TenantId.Should().Be(_testTenantId);
        result.DeviceType.Should().Be("Centrifugal Pump");
        result.FailureMode.Should().Be("Bearing Wear");
        result.Severity.Should().Be(7);
        result.Occurrence.Should().Be(5);
        result.Detectability.Should().Be(3);
        result.Rpn.Should().Be(105, "RPN = Severity x Occurrence x Detectability = 7 x 5 x 3 = 105");
        result.IsEnabled.Should().BeTrue();
        result.KnowledgeRuleId.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_Should_Save_KnowledgeRuleId()
    {
        var knowledgeRuleId = Guid.NewGuid();
        _dbContext.KnowledgeRules.Add(CreateKnowledgeRule(knowledgeRuleId, _testTenantId));
        await _dbContext.SaveChangesAsync();

        var request = new CreateFmeaEntryRequest
        {
            DeviceType = "Air Compressor",
            FailureMode = "Motor Overload",
            Cause = "Excessive Load",
            Effect = "Equipment Shutdown",
            Detection = "Current > 180A",
            RecommendedAction = "Reduce Load",
            Severity = 8,
            Occurrence = 4,
            Detectability = 2,
            KnowledgeRuleId = knowledgeRuleId
        };

        var result = await _fmeaService.CreateAsync(request);
        result.KnowledgeRuleId.Should().Be(knowledgeRuleId);
    }

    [Fact]
    public async Task CreateAsync_Should_Reject_KnowledgeRule_From_AnotherTenant()
    {
        var knowledgeRuleId = Guid.NewGuid();
        _dbContext.KnowledgeRules.Add(CreateKnowledgeRule(knowledgeRuleId, Guid.NewGuid()));
        await _dbContext.SaveChangesAsync();

        var act = () => _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Air Compressor",
            FailureMode = "Motor Overload",
            Cause = "Excessive Load",
            Effect = "Equipment Shutdown",
            Detection = "Current > 180A",
            RecommendedAction = "Reduce Load",
            Severity = 8,
            Occurrence = 4,
            Detectability = 2,
            KnowledgeRuleId = knowledgeRuleId,
        });

        await act.Should().ThrowAsync<FmeaValidationException>()
            .WithMessage("*不属于当前租户*");
    }

    [Fact]
    public async Task CreateAsync_Should_Accept_SystemTenantKnowledgeRule()
    {
        var knowledgeRuleId = Guid.NewGuid();
        _dbContext.KnowledgeRules.Add(CreateKnowledgeRule(knowledgeRuleId, SystemConstants.SystemTenantId));
        await _dbContext.SaveChangesAsync();

        var result = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Air Compressor",
            FailureMode = "Motor Overload",
            Cause = "Excessive Load",
            Effect = "Equipment Shutdown",
            Detection = "Current > 180A",
            RecommendedAction = "Reduce Load",
            Severity = 8,
            Occurrence = 4,
            Detectability = 2,
            KnowledgeRuleId = knowledgeRuleId,
        });

        result.KnowledgeRuleId.Should().Be(knowledgeRuleId);
    }

    [Fact]
    public async Task GetEntriesAsync_Should_Return_Paged_Results()
    {
        for (int i = 0; i < 5; i++)
        {
            await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
            {
                DeviceType = "Test Equipment",
                FailureMode = $"Failure Mode {i}",
                Cause = "Test Cause",
                Effect = "Test Effect",
                Detection = "Test Detection",
                RecommendedAction = "Test Action",
                Severity = 5, Occurrence = 5, Detectability = 5
            });
        }

        var (items, total) = await _fmeaService.GetEntriesAsync(page: 1, pageSize: 2);
        total.Should().Be(5);
        items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetEntriesAsync_Should_Filter_By_DeviceType()
    {
        await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Centrifugal Pump",
            FailureMode = "Pump Failure",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Air Compressor",
            FailureMode = "Compressor Failure",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        var (items, total) = await _fmeaService.GetEntriesAsync(
            page: 1, pageSize: 10, deviceType: "Centrifugal Pump");

        total.Should().Be(1);
        items.Should().HaveCount(1);
        items[0].DeviceType.Should().Be("Centrifugal Pump");
    }

    [Fact]
    public async Task GetEntriesAsync_Should_Filter_By_IsEnabled()
    {
        var entry1 = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Equipment A",
            FailureMode = "Failure A",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Equipment B",
            FailureMode = "Failure B",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        await _fmeaService.ToggleEnabledAsync(entry1.Id);

        var (items, total) = await _fmeaService.GetEntriesAsync(
            page: 1, pageSize: 10, isEnabled: true);

        total.Should().Be(1);
        items.Should().HaveCount(1);
        items[0].FailureMode.Should().Be("Failure B");
    }

    [Fact]
    public async Task UpdateAsync_Should_Update_FMEA_Entry()
    {
        var created = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Original Equipment",
            FailureMode = "Original Failure",
            Cause = "Original Cause", Effect = "Original Effect",
            Detection = "Original Detection", RecommendedAction = "Original Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        var updated = await _fmeaService.UpdateAsync(created.Id, new UpdateFmeaEntryRequest
        {
            DeviceType = "New Equipment",
            FailureMode = "New Failure",
            Cause = "New Cause", Effect = "New Effect",
            Detection = "New Detection", RecommendedAction = "New Action",
            Severity = 8, Occurrence = 6, Detectability = 4
        });

        updated.Should().NotBeNull();
        updated!.DeviceType.Should().Be("New Equipment");
        updated.FailureMode.Should().Be("New Failure");
        updated.Rpn.Should().Be(192, "RPN = 8 x 6 x 4 = 192");
    }

    [Fact]
    public async Task UpdateAsync_Should_Return_Null_For_Nonexistent_Id()
    {
        var result = await _fmeaService.UpdateAsync(Guid.NewGuid(), new UpdateFmeaEntryRequest
        {
            DeviceType = "Test", FailureMode = "Test",
            Cause = "Test", Effect = "Test",
            Detection = "Test", RecommendedAction = "Test",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_Should_Reject_KnowledgeRule_From_AnotherTenant()
    {
        var created = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Original Equipment",
            FailureMode = "Original Failure",
            Cause = "Original Cause", Effect = "Original Effect",
            Detection = "Original Detection", RecommendedAction = "Original Action",
            Severity = 5, Occurrence = 5, Detectability = 5,
        });
        var knowledgeRuleId = Guid.NewGuid();
        _dbContext.KnowledgeRules.Add(CreateKnowledgeRule(knowledgeRuleId, Guid.NewGuid()));
        await _dbContext.SaveChangesAsync();

        var act = () => _fmeaService.UpdateAsync(created.Id, new UpdateFmeaEntryRequest
        {
            DeviceType = "New Equipment",
            FailureMode = "New Failure",
            Cause = "New Cause", Effect = "New Effect",
            Detection = "New Detection", RecommendedAction = "New Action",
            Severity = 8, Occurrence = 6, Detectability = 4,
            KnowledgeRuleId = knowledgeRuleId,
        });

        await act.Should().ThrowAsync<FmeaValidationException>()
            .WithMessage("*不属于当前租户*");
    }

    [Fact]
    public async Task DeleteAsync_Should_Delete_FMEA_Entry()
    {
        var created = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "ToDelete Equipment",
            FailureMode = "ToDelete Failure",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        var deleted = await _fmeaService.DeleteAsync(created.Id);
        deleted.Should().BeTrue();

        var (items, total) = await _fmeaService.GetEntriesAsync(1, 10);
        total.Should().Be(0);
    }

    [Fact]
    public async Task DeleteAsync_Should_Return_False_For_Nonexistent_Id()
    {
        var result = await _fmeaService.DeleteAsync(Guid.NewGuid());
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleEnabledAsync_Should_Toggle_Status()
    {
        var created = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
        {
            DeviceType = "Test Equipment",
            FailureMode = "Test Failure",
            Cause = "Cause", Effect = "Effect",
            Detection = "Detection", RecommendedAction = "Action",
            Severity = 5, Occurrence = 5, Detectability = 5
        });

        created.IsEnabled.Should().BeTrue();

        var result1 = await _fmeaService.ToggleEnabledAsync(created.Id);
        result1.Should().BeTrue();

        var (items1, _) = await _fmeaService.GetEntriesAsync(1, 10);
        items1[0].IsEnabled.Should().BeFalse();

        var result2 = await _fmeaService.ToggleEnabledAsync(created.Id);
        result2.Should().BeTrue();

        var (items2, _) = await _fmeaService.GetEntriesAsync(1, 10);
        items2[0].IsEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task RPN_Should_Be_Calculated_Correctly()
    {
        var testCases = new[]
        {
            (Severity: 10, Occurrence: 10, Detectability: 10, ExpectedRpn: 1000),
            (Severity: 1, Occurrence: 1, Detectability: 1, ExpectedRpn: 1),
            (Severity: 5, Occurrence: 5, Detectability: 5, ExpectedRpn: 125),
            (Severity: 8, Occurrence: 6, Detectability: 4, ExpectedRpn: 192)
        };

        foreach (var (Severity, Occurrence, Detectability, ExpectedRpn) in testCases)
        {
            var result = await _fmeaService.CreateAsync(new CreateFmeaEntryRequest
            {
                DeviceType = "RPN Test",
                FailureMode = $"RPN {Severity}{Occurrence}{Detectability}",
                Cause = "Cause", Effect = "Effect",
                Detection = "Detection", RecommendedAction = "Action",
                Severity = Severity, Occurrence = Occurrence, Detectability = Detectability
            });

            result.Rpn.Should().Be(ExpectedRpn,
                $"RPN = {Severity} x {Occurrence} x {Detectability} = {ExpectedRpn}");
        }
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private static KnowledgeRule CreateKnowledgeRule(Guid id, Guid tenantId)
    {
        return new KnowledgeRule
        {
            Id = id,
            TenantId = tenantId,
            DeviceType = "Air Compressor",
            Name = "Motor overload rule",
            Conditions = "[]",
            Conclusion = "Motor overload",
        };
    }
}
